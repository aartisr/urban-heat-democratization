import { useMemo, useState } from "react";

import type { ScenarioRecord } from "../lib/types";

type SankeyColumn = 0 | 1 | 2;

type SankeyNode = {
  id: string;
  label: string;
  value: number;
  color: string;
  detail: string;
  column: SankeyColumn;
  kind: "budget" | "evidence" | "category";
  x: number;
  y: number;
  width: number;
  height: number;
};

type SankeyLink = {
  id: string;
  sourceId: string;
  targetId: string;
  value: number;
  color: string;
  detail: string;
  sourceY1: number;
  sourceY2: number;
  targetY1: number;
  targetY2: number;
};

type ScenarioSankeyCardProps = {
  scenario: ScenarioRecord | null;
  title?: string;
  description?: string;
  className?: string;
};

const NODE_WIDTH = 132;
const NODE_GAP = 8;
const CHART_WIDTH = 880;
const MIN_CHART_HEIGHT = 500;
const MAX_CHART_HEIGHT = 860;
const PADDING = { top: 16, right: 24, bottom: 16, left: 24 };

function columnX(column: SankeyColumn) {
  const available = CHART_WIDTH - PADDING.left - PADDING.right - NODE_WIDTH;
  const step = available / 2;
  return PADDING.left + (column * step);
}

const STATUS_COLORS: Record<ScenarioRecord["recommendedActions"][number]["costStatus"], string> = {
  verified_unit_cost: "#0f766e",
  ranking_only: "#2563eb",
  benchmark_only: "#d97706",
};

const CATEGORY_COLORS: Record<string, string> = {
  "urban forestry": "#0f766e",
  "building cooling": "#2563eb",
  "surface cooling": "#d97706",
  "public-realm shade": "#7c3aed",
  "vertical greening": "#059669",
  default: "#334155",
};

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function shortLabel(label: string) {
  const segments = label.split(/\s+/).filter(Boolean);
  if (segments.length <= 3 && label.length <= 24) {
    return label;
  }
  return segments.slice(0, 3).join(" ");
}

function blendColor(hex: string, amount = 0.18) {
  const normalized = hex.trim().replace(/^#/, "");
  if (![3, 6].includes(normalized.length)) {
    return hex;
  }
  const full = normalized.length === 3
    ? normalized.split("").map((char) => `${char}${char}`).join("")
    : normalized;
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) {
    return hex;
  }
  const channels = [
    (value >> 16) & 255,
    (value >> 8) & 255,
    value & 255,
  ].map((channel) => Math.round(channel + ((255 - channel) * amount)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function categoryColor(category: string) {
  return CATEGORY_COLORS[category.trim().toLowerCase()] ?? CATEGORY_COLORS.default;
}

function actionValue(action: ScenarioRecord["recommendedActions"][number]) {
  return Math.max(0, action.allocatedBudgetUsd ?? action.estimatedProgramCostUsd ?? action.unitCostUsd ?? 0);
}

function actionCostLabel(action: ScenarioRecord["recommendedActions"][number]) {
  const unit = action.measurementUnit?.trim();
  const unitLabel = unit ? `/${unit}` : "";
  if (action.unitCostUsd != null && action.estimatedProgramCostUsd != null) {
    return `Seed ${action.unitCostUsd.toLocaleString()}${unitLabel} · Program estimate $${action.estimatedProgramCostUsd.toLocaleString()}`;
  }
  if (action.estimatedProgramCostUsd != null) {
    return `Program cost estimate: $${action.estimatedProgramCostUsd.toLocaleString()}`;
  }
  if (action.unitCostUsd != null) {
    return `Seed ${action.unitCostUsd.toLocaleString()}${unitLabel}`;
  }
  if (action.allocatedBudgetUsd != null) {
    return `Allocated benchmark budget: $${action.allocatedBudgetUsd.toLocaleString()}`;
  }
  return "No budget allocation attached yet.";
}

function makeFlowKey(parts: Array<string | number>) {
  return parts.join("::");
}

function buildScenarioSankey(scenario: ScenarioRecord) {
  const actions = [...scenario.recommendedActions].filter((action) => actionValue(action) > 0);
  const allocatedBudget = Math.max(0, scenario.allocationSummary.totalAllocatedBudgetUsd);
  const unallocatedBudget = Math.max(0, scenario.allocationSummary.unallocatedBudgetUsd);

  const evidenceGroups = new Map<string, number>();
  const categoryGroups = new Map<string, number>();
  actions.forEach((action) => {
    const value = actionValue(action);
    evidenceGroups.set(action.costStatus, (evidenceGroups.get(action.costStatus) ?? 0) + value);
    categoryGroups.set(action.category || "Actions", (categoryGroups.get(action.category || "Actions") ?? 0) + value);
  });

  const nodeLookup = new Map<string, SankeyNode>();
  const columnNodes: Record<SankeyColumn, SankeyNode[]> = { 0: [], 1: [], 2: [] };

  const budgetNode: SankeyNode = {
    id: `${scenario.id}-budget`,
    label: "Budget",
    value: Math.max(scenario.budgetUsd, allocatedBudget + unallocatedBudget),
    color: "#0f172a",
    detail: `${formatCurrency(scenario.budgetUsd)} total scenario budget.`,
    column: 0,
    kind: "budget",
    x: columnX(0),
    y: PADDING.top,
    width: NODE_WIDTH,
    height: 1,
  };
  const budgetNodes = [budgetNode];

  const evidenceOrder: Array<ScenarioRecord["recommendedActions"][number]["costStatus"]> = [
    "verified_unit_cost",
    "ranking_only",
    "benchmark_only",
  ];
  const evidenceLabels: Record<typeof evidenceOrder[number], string> = {
    verified_unit_cost: "Verified",
    ranking_only: "Ranked",
    benchmark_only: "Benchmark",
  };
  const evidenceNodes: SankeyNode[] = [
    ...(unallocatedBudget > 0
      ? [{
          id: `${scenario.id}-unallocated`,
          label: "Unallocated",
          value: unallocatedBudget,
          color: "#64748b",
          detail: `${formatCurrency(unallocatedBudget)} remains unassigned in the current plan.`,
          column: 1 as SankeyColumn,
          kind: "evidence" as const,
          x: columnX(1),
          y: PADDING.top,
          width: NODE_WIDTH,
          height: 1,
        }]
      : []),
    ...evidenceOrder
      .map((status) => ({
        id: `${scenario.id}-evidence-${status}`,
        label: evidenceLabels[status],
        value: evidenceGroups.get(status) ?? 0,
        color: STATUS_COLORS[status],
        detail: `${actions.filter((action) => action.costStatus === status).length} action(s) carrying ${formatCurrency(evidenceGroups.get(status) ?? 0)} of budget.`,
        column: 1 as SankeyColumn,
        kind: "evidence" as const,
        x: columnX(1),
        y: PADDING.top,
        width: NODE_WIDTH,
        height: 1,
      }))
      .filter((node) => node.value > 0),
  ];

  const categoryEntries = Array.from(categoryGroups.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const categoryNodes = categoryEntries.map(([category, value]) => ({
    id: `${scenario.id}-category-${category.replace(/\s+/g, "-").toLowerCase()}`,
    label: shortLabel(category),
    value,
    color: blendColor(categoryColor(category), 0.1),
    detail: `${category} carries ${formatCurrency(value)} of the scenario budget.`,
    column: 2 as SankeyColumn,
    kind: "category" as const,
    x: columnX(2),
    y: PADDING.top,
    width: NODE_WIDTH,
    height: 1,
  }));

  columnNodes[0] = budgetNodes;
  columnNodes[1] = evidenceNodes;
  columnNodes[2] = categoryNodes;
  Object.values(columnNodes).flat().forEach((node) => nodeLookup.set(node.id, node));

  const links: SankeyLink[] = [];
  const totalActionValue = actions.reduce((sum, action) => sum + actionValue(action), 0);
  if (totalActionValue > 0) {
    for (const action of actions) {
      const value = actionValue(action);
      const evidenceTargetId = `${scenario.id}-evidence-${action.costStatus}`;
      const categoryTargetId = `${scenario.id}-category-${action.category.replace(/\s+/g, "-").toLowerCase()}`;
      links.push({
        id: makeFlowKey([scenario.id, "budget", action.interventionId]),
        sourceId: budgetNode.id,
        targetId: evidenceTargetId,
        value,
        color: STATUS_COLORS[action.costStatus],
        detail: `${formatCurrency(value)} allocated to ${evidenceLabels[action.costStatus]} evidence.`,
        sourceY1: 0,
        sourceY2: 0,
        targetY1: 0,
        targetY2: 0,
      });
      links.push({
        id: makeFlowKey([scenario.id, "evidence", action.costStatus, action.interventionId]),
        sourceId: evidenceTargetId,
        targetId: categoryTargetId,
        value,
        color: blendColor(STATUS_COLORS[action.costStatus], action.costStatus === "verified_unit_cost" ? 0.08 : 0.14),
        detail: `${formatCurrency(value)} flows into ${action.category}.`,
        sourceY1: 0,
        sourceY2: 0,
        targetY1: 0,
        targetY2: 0,
      });
    }
  }

  if (unallocatedBudget > 0) {
    links.push({
      id: makeFlowKey([scenario.id, "unallocated", "budget"]),
      sourceId: budgetNode.id,
      targetId: `${scenario.id}-unallocated`,
      value: unallocatedBudget,
      color: "#64748b",
      detail: `${formatCurrency(unallocatedBudget)} remains unallocated.`,
      sourceY1: 0,
      sourceY2: 0,
      targetY1: 0,
      targetY2: 0,
    });
  }

  return { columnNodes, nodeLookup, links, allocatedBudget, unallocatedBudget, totalActionValue };
}

function layoutColumn(nodes: SankeyNode[], chartHeight: number) {
  if (!nodes.length) {
    return [];
  }
  const availableHeight = chartHeight - PADDING.top - PADDING.bottom;
  const totalValue = nodes.reduce((sum, node) => sum + Math.max(0.001, node.value), 0);
  const effectiveGap = nodes.length > 1 ? NODE_GAP : 0;
  const totalGap = effectiveGap * Math.max(0, nodes.length - 1);
  const drawableHeight = Math.max(20, availableHeight - totalGap);
  const baseScale = totalValue > 0 ? drawableHeight / totalValue : 1;
  const rawHeights = nodes.map((node) => Math.max(8, Math.max(0.001, node.value) * baseScale));
  const rawTotal = rawHeights.reduce((sum, height) => sum + height, 0);
  const shrink = rawTotal > drawableHeight ? drawableHeight / rawTotal : 1;
  let cursor = PADDING.top;
  return nodes.map((node, index) => {
    const height = Math.max(6, rawHeights[index] * shrink);
    const laidOut = { ...node, y: cursor, height };
    cursor += height + effectiveGap;
    return laidOut;
  });
}

function linkPath(link: SankeyLink, source: SankeyNode, target: SankeyNode) {
  const sourceX = source.x + source.width;
  const targetX = target.x;
  const curvature = Math.max(120, (targetX - sourceX) * 0.45);
  const midX = sourceX + curvature;
  const endCurve = targetX - curvature;
  const sourceY = (link.sourceY1 + link.sourceY2) / 2;
  const targetY = (link.targetY1 + link.targetY2) / 2;
  return `M ${sourceX} ${sourceY} C ${midX} ${sourceY}, ${endCurve} ${targetY}, ${targetX} ${targetY}`;
}

export function ScenarioSankeyCard({ scenario, title = "Scenario budget Sankey", description, className }: ScenarioSankeyCardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sankey = useMemo(() => {
    if (!scenario) {
      return null;
    }
    const built = buildScenarioSankey(scenario);
    const widestColumn = Math.max(...Object.values(built.columnNodes).map((nodes) => nodes.length));
    const chartHeight = clamp(
      MIN_CHART_HEIGHT,
      360 + widestColumn * 52,
      MAX_CHART_HEIGHT,
    );
    const columnNodes = {
      0: layoutColumn(built.columnNodes[0], chartHeight),
      1: layoutColumn(built.columnNodes[1], chartHeight),
      2: layoutColumn(built.columnNodes[2], chartHeight),
    };
    const nodeLookup = new Map<string, SankeyNode>();
    Object.values(columnNodes).flat().forEach((node) => nodeLookup.set(node.id, node));

    const linkSourceOffsets = new Map<string, number>();
    const linkTargetOffsets = new Map<string, number>();
    const links = built.links.map((link) => {
      const source = nodeLookup.get(link.sourceId);
      const target = nodeLookup.get(link.targetId);
      if (!source || !target) {
        return null;
      }
      const sourceHeight = Math.max(4, (link.value / Math.max(1, source.value)) * source.height);
      const targetHeight = Math.max(4, (link.value / Math.max(1, target.value)) * target.height);
      const sourceOffset = linkSourceOffsets.get(source.id) ?? 0;
      const targetOffset = linkTargetOffsets.get(target.id) ?? 0;
      linkSourceOffsets.set(source.id, sourceOffset + sourceHeight);
      linkTargetOffsets.set(target.id, targetOffset + targetHeight);
      return {
        ...link,
        sourceY1: source.y + sourceOffset,
        sourceY2: source.y + sourceOffset + sourceHeight,
        targetY1: target.y + targetOffset,
        targetY2: target.y + targetOffset + targetHeight,
      };
    }).filter((link): link is SankeyLink => link !== null);

    return { ...built, columnNodes, nodeLookup, links, chartHeight };
  }, [scenario]);

  if (!scenario || !sankey) {
    return null;
  }

  const activeNode = activeId ? sankey.nodeLookup.get(activeId) ?? null : null;
  const activeLink = activeId ? sankey.links.find((link) => link.id === activeId) ?? null : null;
  const totalAllocated = sankey.allocatedBudget;
  const categoryLeader = sankey.columnNodes[2][0];
  const evidenceLeader = sankey.columnNodes[1][0];
  const topActions = [...scenario.recommendedActions]
    .sort((left, right) => {
      const leftPriority = left.priorityRank ?? Number.MAX_SAFE_INTEGER;
      const rightPriority = right.priorityRank ?? Number.MAX_SAFE_INTEGER;
      return leftPriority - rightPriority || actionValue(right) - actionValue(left) || left.name.localeCompare(right.name);
    })
    .slice(0, 6);
  const defaultSummary = `Budget flows from ${formatCurrency(scenario.budgetUsd)} into ${scenario.recommendedActions.length} action${scenario.recommendedActions.length === 1 ? "" : "s"}, with ${Math.round(scenario.allocationSummary.allocationCoveragePct * 100)}% coverage and ${formatCurrency(sankey.unallocatedBudget)} unallocated.`;

  const detailTitle = activeLink
    ? `${activeLink.detail}`
    : activeNode
      ? activeNode.label
      : scenario.label;
  const detailBody = activeLink
    ? `This link represents ${formatCurrency(activeLink.value)} of flow between adjacent layers.`
    : activeNode
      ? activeNode.detail
      : defaultSummary;

  return (
    <article className={`panel-card premium-section-card scenario-sankey-card ${className ?? ""}`.trim()}>
      <div className="scenario-sankey-head">
        <div>
          <div className="eyebrow">Budget flow</div>
          <h3>{title}</h3>
          <p className="muted">
            {description ?? "The Sankey turns a scenario into a visible budget trail: total spend, evidence quality, intervention families, and the final actions receive their share in one continuous flow."}
          </p>
        </div>
        <div className="scenario-sankey-head-metrics">
          <div className="truth-badge derived">{Math.round(scenario.allocationSummary.allocationCoveragePct * 100)}% coverage</div>
          <div className="truth-badge observed">{formatCurrency(totalAllocated)} allocated</div>
        </div>
      </div>

      <div className="scenario-sankey-layout">
        <div className="scenario-sankey-visual">
          <div className="scenario-sankey-headers" aria-hidden="true">
            <span>Budget</span>
            <span>Evidence quality</span>
            <span>Intervention families</span>
          </div>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${sankey.chartHeight}`}
            className="scenario-sankey-svg"
            role="img"
            aria-label={`${scenario.label} budget Sankey diagram`}
          >
            <defs>
              <linearGradient id="sankeyStrokeBudget" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width={CHART_WIDTH} height={sankey.chartHeight} rx="28" className="scenario-sankey-backdrop" />
            {sankey.links.map((link) => {
              const source = sankey.nodeLookup.get(link.sourceId);
              const target = sankey.nodeLookup.get(link.targetId);
              if (!source || !target) {
                return null;
              }
              const isActive = activeId == null || activeId === link.id || activeId === link.sourceId || activeId === link.targetId;
              return (
                <path
                  key={link.id}
                  d={linkPath(link, source, target)}
                  className={`scenario-sankey-link ${isActive ? "is-active" : "is-dimmed"} ${activeId === link.id ? "is-flowing" : ""}`}
                  stroke={link.color}
                  strokeWidth={clamp(2, Math.min(link.sourceY2 - link.sourceY1, link.targetY2 - link.targetY1) * 0.82, 24)}
                  onMouseEnter={() => setActiveId(link.id)}
                  onMouseLeave={() => setActiveId(null)}
                >
                  <title>{link.detail}</title>
                </path>
              );
            })}
            {Object.values(sankey.columnNodes).flat().map((node) => {
              const isActive = activeId == null || activeId === node.id || sankey.links.some((link) => link.id === activeId && (link.sourceId === node.id || link.targetId === node.id));
              const labelColor = node.kind === "budget" ? "#eef6ff" : "#f8fcff";
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseEnter={() => setActiveId(node.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(node.id)}
                  onBlur={() => setActiveId(null)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.label}, ${formatCurrency(node.value)}`}
                  className={`scenario-sankey-node-group ${isActive ? "is-active" : "is-dimmed"} ${activeId === node.id ? "is-pinned" : ""}`}
                >
                  <rect
                    width={node.width}
                    height={node.height}
                    rx="18"
                    className={`scenario-sankey-node scenario-sankey-node--${node.kind}`}
                    fill={node.color}
                  />
                  <rect width={node.width} height={node.height} rx="18" className="scenario-sankey-node-overlay" />
                  <rect width={node.width} height={node.height} rx="18" className="scenario-sankey-node-glow" />
                  <text
                    x={16}
                    y={node.height / 2 - 4}
                    textAnchor="start"
                    className="scenario-sankey-node-label"
                    fill={labelColor}
                  >
                    {node.label}
                  </text>
                  <text
                    x={16}
                    y={node.height / 2 + 13}
                    textAnchor="start"
                    className="scenario-sankey-node-value"
                    fill={labelColor}
                  >
                    {node.height >= 34 ? formatCurrency(node.value) : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="scenario-sankey-bottom">
          <aside className="scenario-sankey-detail">
            <div className="scenario-sankey-detail-card">
              <div className="scenario-sankey-detail-head">
                <div>
                  <div className="eyebrow">{activeLink ? "Flow detail" : "Node detail"}</div>
                  <h4>{detailTitle}</h4>
                </div>
                <div className={`truth-badge ${activeNode?.kind === "budget" ? "observed" : "derived"}`}>
                  {activeNode ? activeNode.kind : "Summary"}
                </div>
              </div>
              <p>{detailBody}</p>
              <div className="scenario-sankey-detail-grid">
                <div>
                  <span>Allocated</span>
                  <strong>{formatCurrency(totalAllocated)}</strong>
                </div>
                <div>
                  <span>Unallocated</span>
                  <strong>{formatCurrency(sankey.unallocatedBudget)}</strong>
                </div>
                <div>
                  <span>Evidence leader</span>
                  <strong>{evidenceLeader?.label ?? "None"}</strong>
                </div>
                <div>
                  <span>Category leader</span>
                  <strong>{categoryLeader?.label ?? "None"}</strong>
                </div>
              </div>
              <div className="scenario-sankey-category-stack">
                <div className="eyebrow">Top intervention families</div>
                {sankey.columnNodes[2].map((node) => (
                  <div key={node.id} className="scenario-sankey-family-row">
                    <div>
                      <strong>{node.label}</strong>
                      <span>{formatCurrency(node.value)}</span>
                    </div>
                    <div className="scenario-sankey-family-bar">
                      <svg className="scenario-sankey-family-meter" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
                        <rect x="0" y="0" width={Math.max(14, (node.value / Math.max(1, totalAllocated)) * 100)} height="8" rx="4" fill={node.color} />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
              <div className="scenario-sankey-detail-pills">
                <span>{scenario.evidenceSummary.readinessLabel}</span>
                <span>{scenario.recommendedActions.length} actions</span>
                <span>{Math.round(scenario.allocationSummary.allocationCoveragePct * 100)}% coverage</span>
              </div>
            </div>
            <div className="scenario-sankey-detail-card scenario-sankey-detail-card--story">
              <div className="eyebrow">Why this is the best fit</div>
              <p>
                Sankey diagrams are strongest when a user needs to trace a single conserved quantity through a pipeline. Here that conserved quantity is budget, which moves from scenario total to evidence quality and then into intervention families and actions.
              </p>
              <p className="muted">
                Hover any band or node to isolate one path. The active highlight stays deliberately soft so the chart remains readable instead of flashy.
              </p>
            </div>
          </aside>

          <section className="scenario-sankey-action-panel" aria-label="Most important actions">
            <div className="scenario-sankey-action-panel-head">
              <div>
                <div className="eyebrow">Most important actions</div>
                <p className="muted scenario-sankey-action-stack-note">
                  These six boxes sit beneath the chart so the flow stays readable while the action story stays visible.
                </p>
              </div>
              <div className="scenario-sankey-action-panel-badge truth-badge derived">
                6 action view
              </div>
            </div>
            <div className="scenario-sankey-action-stack">
              {topActions.map((action, index) => (
                <div
                  key={action.interventionId}
                  className="scenario-sankey-action-row"
                  title={actionCostLabel(action)}
                >
                  <div className="scenario-sankey-action-row-head">
                    <div className={`truth-badge ${action.costStatus === "verified_unit_cost" ? "observed" : action.costStatus === "benchmark_only" ? "estimated" : "derived"}`}>
                      {action.costStatus.replaceAll("_", " ")}
                    </div>
                    <span className="scenario-sankey-action-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="scenario-sankey-action-copy">
                    <strong>{action.name}</strong>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="scenario-sankey-footnote">
        <span>Budget source: scenario allocation summary</span>
        <span>Action layer: recommended scenario actions</span>
        <span>Evidence layer: verified, ranked, and benchmark buckets</span>
      </div>
    </article>
  );
}
