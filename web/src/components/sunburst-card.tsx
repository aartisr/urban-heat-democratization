import { useMemo, useState } from "react";

export type SunburstNode = {
  id: string;
  label: string;
  value: number;
  color: string;
  detail: string;
  tone?: "observed" | "derived" | "estimated" | "illustrative";
  children?: SunburstNode[];
};

type LayoutNode = SunburstNode & {
  depth: number;
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  path: string;
  breadcrumb: string[];
};

type SunburstCardProps = {
  title: string;
  description: string;
  centerLabel: string;
  centerDetail: string;
  centerMeta?: string;
  nodes: SunburstNode[];
  className?: string;
};

const TAU = Math.PI * 2;
const START_ANGLE = -Math.PI / 2;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;
const SUNBURST_FALLBACK_COLORS = [
  "#0f766e",
  "#2563eb",
  "#4f46e5",
  "#7c3aed",
  "#d97706",
  "#059669",
  "#0284c7",
  "#db2777",
  "#475569",
];

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(color: string) {
  const hex = color.trim().replace(/^#/, "");
  if (![3, 6].includes(hex.length)) {
    return null;
  }
  const normalized = hex.length === 3
    ? hex.split("").map((char) => `${char}${char}`).join("")
    : hex;
  const value = Number.parseInt(normalized, 16);
  if (Number.isNaN(value)) {
    return null;
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function colorLuminance(color: string) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return 255;
  }
  return (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b);
}

function stableColorIndex(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % SUNBURST_FALLBACK_COLORS.length;
}

function ensureReadableSunburstColor(color: string | undefined, seed: string) {
  const trimmed = (color ?? "").trim();
  const luminance = colorLuminance(trimmed);
  if (!trimmed || trimmed === "#fff" || trimmed === "#ffffff" || luminance > 210) {
    return SUNBURST_FALLBACK_COLORS[stableColorIndex(seed)];
  }
  return trimmed;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angle: number) {
  return {
    x: centerX + (radius * Math.cos(angle)),
    y: centerY + (radius * Math.sin(angle)),
  };
}

function describeArcSegment(
  centerX: number,
  centerY: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const safeInner = Math.max(0, innerRadius);
  const safeOuter = Math.max(safeInner + 1, outerRadius);
  const clampedEnd = Math.max(startAngle + 0.0001, endAngle);
  const largeArc = clampedEnd - startAngle > Math.PI ? 1 : 0;
  const outerStart = polarToCartesian(centerX, centerY, safeOuter, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, safeOuter, clampedEnd);
  const innerEnd = polarToCartesian(centerX, centerY, safeInner, clampedEnd);
  const innerStart = polarToCartesian(centerX, centerY, safeInner, startAngle);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${safeOuter.toFixed(2)} ${safeOuter.toFixed(2)} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${safeInner.toFixed(2)} ${safeInner.toFixed(2)} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function sumNode(node: SunburstNode): number {
  if (node.children && node.children.length > 0) {
    return node.children.reduce((sum, child) => sum + sumNode(child), 0);
  }
  return Math.max(0, node.value);
}

function maxDepth(nodes: SunburstNode[], depth = 1): number {
  if (!nodes.length) {
    return depth;
  }
  return nodes.reduce((maximum, node) => {
    const nextDepth = node.children && node.children.length > 0 ? maxDepth(node.children, depth + 1) : depth;
    return Math.max(maximum, nextDepth);
  }, depth);
}

function layoutNodes(
  nodes: SunburstNode[],
  depth: number,
  startAngle: number,
  endAngle: number,
  innerRadius: number,
  ringSize: number,
  breadcrumb: string[],
): LayoutNode[] {
  const total = nodes.reduce((sum, node) => sum + sumNode(node), 0);
  if (total <= 0) {
    return [];
  }

  let currentAngle = startAngle;
  const result: LayoutNode[] = [];

  for (const node of nodes) {
    const value = sumNode(node);
    const angleSpan = ((endAngle - startAngle) * value) / total;
    const nextAngle = currentAngle + angleSpan;
    const outerRadius = innerRadius + ringSize;
    const currentBreadcrumb = [...breadcrumb, node.label];
    result.push({
      ...node,
      value,
      depth,
      startAngle: currentAngle,
      endAngle: nextAngle,
      innerRadius,
      outerRadius,
      path: describeArcSegment(280, 280, innerRadius, outerRadius, currentAngle, nextAngle),
      breadcrumb: currentBreadcrumb,
    });
    if (node.children && node.children.length > 0) {
      result.push(
        ...layoutNodes(
          node.children,
          depth + 1,
          currentAngle,
          nextAngle,
          outerRadius,
          ringSize,
          currentBreadcrumb,
        ),
      );
    }
    currentAngle = nextAngle;
  }

  return result;
}

function formatShare(value: number, total: number) {
  if (total <= 0) {
    return "0%";
  }
  return `${Math.round((value / total) * 100)}%`;
}

export function SunburstCard({ title, description, centerLabel, centerDetail, centerMeta, nodes, className }: SunburstCardProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [pinnedNodeId, setPinnedNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [compact, setCompact] = useState(false);

  const layout = useMemo(() => {
    const depthCount = Math.max(1, maxDepth(nodes));
    const outerRadius = 236;
    const innerHole = 82;
    const ringSize = (outerRadius - innerHole) / depthCount;
    const structured = layoutNodes(nodes, 1, START_ANGLE, START_ANGLE + TAU, innerHole, ringSize, [centerLabel]);
    return {
      depthCount,
      ringSize,
      outerRadius,
      innerHole,
      nodes: structured,
      total: structured.length > 0 ? sumNode({
        id: "root",
        label: centerLabel,
        value: 0,
        color: "transparent",
        detail: centerDetail,
        children: nodes,
      }) : 0,
    };
  }, [centerDetail, centerLabel, nodes]);

  const activeNode = useMemo(() => {
    if (!layout.nodes.length) {
      return null;
    }
    const activeId = pinnedNodeId ?? hoveredNodeId;
    if (activeId) {
      return layout.nodes.find((node) => node.id === activeId) ?? null;
    }
    return layout.nodes.find((node) => node.depth === 1) ?? layout.nodes[0] ?? null;
  }, [hoveredNodeId, layout.nodes, pinnedNodeId]);

  const focusMode = pinnedNodeId ? "Pinned focus" : hoveredNodeId ? "Previewing" : "Tap to explore";
  const centerTitle = hoveredNodeId || pinnedNodeId ? activeNode?.label ?? centerLabel : centerLabel;
  const visualZoom = compact ? Math.max(MIN_ZOOM, zoom - 0.1) : zoom;
  const zoomTransform = `translate(280 280) scale(${visualZoom}) translate(-280 -280)`;

  return (
    <div className={`scenario-sunburst-card ${compact ? "is-compact" : ""} ${className ?? ""}`.trim()}>
      <div className="scenario-sunburst-head">
        <div>
          <div className="eyebrow">Sunburst story</div>
          <h3>{title}</h3>
          <p className="muted">{description}</p>
        </div>
        <div className="scenario-sunburst-head-actions">
          {centerMeta ? <div className="truth-badge derived">{centerMeta}</div> : null}
          <div className="truth-badge observed">{focusMode}</div>
          <div className="scenario-chart-controls" role="group" aria-label="Sunburst zoom and compact controls">
            <button
              type="button"
              className="scenario-chart-control-button"
              onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP))}
              aria-label="Zoom out Sunburst"
            >
              -
            </button>
            <span className="scenario-chart-control-value" aria-live="polite">{Math.round(visualZoom * 100)}%</span>
            <button
              type="button"
              className="scenario-chart-control-button"
              onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP))}
              aria-label="Zoom in Sunburst"
            >
              +
            </button>
            <button
              type="button"
              className={`scenario-chart-control-button scenario-chart-control-button--toggle ${compact ? "is-active" : ""}`}
              onClick={() => setCompact((value) => !value)}
              aria-label={compact ? "Disable compact Sunburst mode" : "Enable compact Sunburst mode"}
            >
              Compact
            </button>
          </div>
        </div>
      </div>
      <div className="scenario-sunburst-guidance">
        <div className="scenario-sunburst-chip">
          <strong>{nodes.length}</strong>
          <span>top-level themes</span>
        </div>
        <div className="scenario-sunburst-chip">
          <strong>{layout.depthCount}</strong>
          <span>layers</span>
        </div>
        <div className="scenario-sunburst-chip">
          <strong>{activeNode ? formatShare(activeNode.value, layout.total) : "0%"}</strong>
          <span>current slice</span>
        </div>
      </div>
      <div className="scenario-sunburst-layout">
        <div className="scenario-sunburst-visual">
          <svg
            viewBox="0 0 560 560"
            role="img"
            aria-label={`${title} sunburst visualization`}
            className="scenario-sunburst-svg"
          >
            <defs>
              <filter id="sunburstGlow" x="-25%" y="-25%" width="150%" height="150%">
                <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.15" />
              </filter>
              <radialGradient id="sunburstCenterGlow" cx="50%" cy="45%" r="60%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.86)" />
              </radialGradient>
            </defs>
            <g transform={zoomTransform}>
            <circle cx="280" cy="280" r="236" className="scenario-sunburst-halo" />
            {layout.nodes.map((node) => {
              const isActive = activeNode?.id === node.id;
              const resolvedColor = ensureReadableSunburstColor(node.color, `${node.id}-${node.label}`);
              return (
                <path
                  key={node.id}
                  d={node.path}
                  fill={resolvedColor}
                  className={`scenario-sunburst-slice ${node.depth === 1 ? "is-depth-one" : ""} tone-${node.tone ?? "derived"} ${isActive ? "is-active" : ""}`}
                  filter={isActive ? "url(#sunburstGlow)" : undefined}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onFocus={() => setHoveredNodeId(node.id)}
                  onBlur={() => setHoveredNodeId(null)}
                  onClick={() => setPinnedNodeId(node.id)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${node.label}. ${node.detail}. Click to pin this segment.`}
                />
              );
            })}
            <circle cx="280" cy="280" r="80" fill="url(#sunburstCenterGlow)" className="scenario-sunburst-center-disc" />
            <circle cx="280" cy="280" r="80" className="scenario-sunburst-center-ring" />
            <text
              key={centerTitle}
              x="280"
              y="280"
              className="scenario-sunburst-center-kicker"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {centerTitle}
            </text>
            </g>
          </svg>
          <div className="scenario-sunburst-ring-key" aria-label="Sunburst ring key">
            {nodes.map((node, index) => (
              <button
                key={node.id}
                type="button"
                className={`scenario-sunburst-ring-key-item ${activeNode?.breadcrumb[1] === node.label ? "is-active" : ""}`}
                onClick={() => setPinnedNodeId(node.id)}
                onFocus={() => setHoveredNodeId(node.id)}
                onBlur={() => setHoveredNodeId(null)}
                aria-label={`${pinnedNodeId === node.id ? "Pinned" : "Inspect"} ${node.label}`}
              >
                <span className="scenario-sunburst-label-swatch">
                  <svg viewBox="0 0 14 14" className="scenario-sunburst-label-swatch-svg" aria-hidden="true">
                    <circle cx="7" cy="7" r="7" fill={ensureReadableSunburstColor(node.color, `${node.id}-${node.label}`)} />
                  </svg>
                </span>
                <span className="scenario-sunburst-ring-key-copy">
                  <strong>{node.label}</strong>
                  <span>{index === 0 ? "Inner evidence ring" : "Outer intervention ring"}</span>
                </span>
                <span className="scenario-sunburst-ring-key-detail">
                  {node.detail.length > 82 ? `${node.detail.slice(0, 82)}…` : node.detail}
                </span>
              </button>
            ))}
        </div>
        </div>
        <div className="scenario-sunburst-side">
          <div key={activeNode?.id ?? "empty"} className="scenario-sunburst-detail">
            <div className="scenario-sunburst-detail-head">
              <div className="eyebrow">Selected segment</div>
              <div className="scenario-sunburst-detail-headline">
                <strong>{activeNode ? activeNode.label : centerLabel}</strong>
                {pinnedNodeId ? <span className="scenario-sunburst-pinned-pill">Pinned</span> : null}
              </div>
            </div>
            <p>{activeNode ? activeNode.detail : centerDetail}</p>
            <div className="scenario-sunburst-detail-meta">
              <span>{activeNode ? `${activeNode.depth} layer${activeNode.depth === 1 ? "" : "s"} deep` : "Start with a segment"}</span>
              <span>{activeNode ? `${activeNode.breadcrumb.slice(1).join(" / ") || activeNode.label}` : "Legend keeps focus pinned"}</span>
            </div>
            {activeNode ? (
              <div className="scenario-sunburst-detail-grid">
                <div>
                  <span>Share</span>
                  <strong>{formatShare(activeNode.value, layout.total)}</strong>
                </div>
                <div>
                  <span>Depth</span>
                  <strong>{activeNode.depth}</strong>
                </div>
              </div>
            ) : null}
            {pinnedNodeId ? (
              <button
                type="button"
                className="button-link secondary scenario-sunburst-reset"
                onClick={() => setPinnedNodeId(null)}
              >
                Reset focus
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
