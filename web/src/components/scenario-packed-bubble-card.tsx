import { useMemo, useState } from "react";

import type { ScenarioRecord } from "../lib/types";

type BubbleDatum = {
  id: string;
  label: string;
  value: number;
  category: string;
  color: string;
};

type PackedBubble = BubbleDatum & {
  x: number;
  y: number;
  r: number;
};

type ScenarioPackedBubbleCardProps = {
  scenario: ScenarioRecord | null;
  className?: string;
};

const WIDTH = 760;
const HEIGHT = 360;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.5;
const ZOOM_STEP = 0.1;

const CATEGORY_COLORS: Record<string, string> = {
  "urban forestry": "#0f766e",
  "building cooling": "#2563eb",
  "surface cooling": "#d97706",
  "public-realm shade": "#7c3aed",
  "vertical greening": "#059669",
  default: "#334155",
};

function actionValue(action: ScenarioRecord["recommendedActions"][number]) {
  return Math.max(0, action.allocatedBudgetUsd ?? action.estimatedProgramCostUsd ?? action.unitCostUsd ?? 0);
}

function categoryColor(category: string) {
  return CATEGORY_COLORS[category.trim().toLowerCase()] ?? CATEGORY_COLORS.default;
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

function clamp(min: number, value: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function overlaps(candidate: PackedBubble, bubbles: PackedBubble[]) {
  for (const bubble of bubbles) {
    const dx = candidate.x - bubble.x;
    const dy = candidate.y - bubble.y;
    const distance = Math.hypot(dx, dy);
    if (distance < candidate.r + bubble.r + 4) {
      return true;
    }
  }
  return false;
}

function packBubbles(data: BubbleDatum[]) {
  if (!data.length) {
    return [];
  }
  const maxValue = Math.max(...data.map((item) => item.value));
  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;
  const bubbles: PackedBubble[] = [];

  data.forEach((item, index) => {
    const r = clamp(16, 20 + (Math.sqrt(item.value / Math.max(1, maxValue)) * 56), 76);
    if (index === 0) {
      bubbles.push({ ...item, x: centerX, y: centerY, r });
      return;
    }

    let placed: PackedBubble | null = null;
    let angle = 0;
    let spiralRadius = 0;
    const maxIterations = 2400;

    for (let step = 0; step < maxIterations; step += 1) {
      angle += 0.37;
      spiralRadius += 0.16;
      const x = centerX + Math.cos(angle) * spiralRadius * 4.2;
      const y = centerY + Math.sin(angle) * spiralRadius * 3.1;
      const candidate: PackedBubble = { ...item, x, y, r };

      if (x - r < 10 || x + r > WIDTH - 10 || y - r < 10 || y + r > HEIGHT - 10) {
        continue;
      }
      if (!overlaps(candidate, bubbles)) {
        placed = candidate;
        break;
      }
    }

    bubbles.push(placed ?? { ...item, x: centerX, y: centerY, r: Math.max(14, r * 0.72) });
  });

  return bubbles;
}

export function ScenarioPackedBubbleCard({ scenario, className }: ScenarioPackedBubbleCardProps) {
  const [zoom, setZoom] = useState(1);
  const [compact, setCompact] = useState(false);
  const [activeBubbleId, setActiveBubbleId] = useState<string | null>(null);

  const bubbleData = useMemo(() => {
    if (!scenario) {
      return [];
    }
    return [...scenario.recommendedActions]
      .map((action) => ({
        id: action.interventionId,
        label: action.name,
        value: actionValue(action),
        category: action.category,
        color: categoryColor(action.category),
      }))
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value)
      .slice(0, compact ? 8 : 12);
  }, [compact, scenario]);

  const packed = useMemo(() => packBubbles(bubbleData), [bubbleData]);

  if (!scenario || !packed.length) {
    return null;
  }

  const visualZoom = compact ? Math.max(MIN_ZOOM, zoom - 0.1) : zoom;
  const zoomTransform = `translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${visualZoom}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`;
  const allocated = scenario.allocationSummary.totalAllocatedBudgetUsd;

  return (
    <article className={`panel-card premium-section-card scenario-packed-bubble-card ${compact ? "is-compact" : ""} ${className ?? ""}`.trim()}>
      <div className="scenario-packed-bubble-head">
        <div>
          <div className="eyebrow">Allocation companion</div>
          <h3>Packed bubble allocation view</h3>
          <p className="muted">
            This packed-bubble view fits naturally beside Sunburst and Sankey: it highlights relative intervention weight quickly,
            without requiring users to trace full links.
          </p>
        </div>
        <div className="scenario-packed-bubble-head-actions">
          <div className="truth-badge observed">{formatCurrency(allocated)} allocated</div>
          <div className="scenario-chart-controls" role="group" aria-label="Packed bubble zoom and compact controls">
            <button
              type="button"
              className="scenario-chart-control-button"
              onClick={() => setZoom((current) => clamp(MIN_ZOOM, current - ZOOM_STEP, MAX_ZOOM))}
              aria-label="Zoom out packed bubble"
            >
              -
            </button>
            <span className="scenario-chart-control-value" aria-live="polite">{Math.round(visualZoom * 100)}%</span>
            <button
              type="button"
              className="scenario-chart-control-button"
              onClick={() => setZoom((current) => clamp(MIN_ZOOM, current + ZOOM_STEP, MAX_ZOOM))}
              aria-label="Zoom in packed bubble"
            >
              +
            </button>
            <button
              type="button"
              className={`scenario-chart-control-button scenario-chart-control-button--toggle ${compact ? "is-active" : ""}`}
              onClick={() => setCompact((value) => !value)}
              aria-label={compact ? "Disable compact packed bubble mode" : "Enable compact packed bubble mode"}
            >
              Compact
            </button>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="scenario-packed-bubble-svg" role="img" aria-label="Packed bubble allocation view">
        <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="26" className="scenario-packed-bubble-backdrop" />
        <g transform={zoomTransform}>
          {packed.map((bubble) => {
            const share = allocated > 0 ? Math.round((bubble.value / allocated) * 100) : 0;
            return (
              <g
                key={bubble.id}
                transform={`translate(${bubble.x} ${bubble.y})`}
                className={`scenario-packed-bubble-node-group ${activeBubbleId === null || activeBubbleId === bubble.id ? "is-active" : "is-muted"}`}
                onMouseEnter={() => setActiveBubbleId(bubble.id)}
                onMouseLeave={() => setActiveBubbleId(null)}
                onFocus={() => setActiveBubbleId(bubble.id)}
                onBlur={() => setActiveBubbleId(null)}
                tabIndex={0}
                role="button"
                aria-label={`${bubble.label}, ${formatCurrency(bubble.value)} (${share}% of allocated budget)`}
              >
                <circle r={bubble.r} fill={bubble.color} className="scenario-packed-bubble-node" />
                <text className="scenario-packed-bubble-label" textAnchor="middle" y={-4}>
                  {bubble.label.length > 20 ? `${bubble.label.slice(0, 20)}…` : bubble.label}
                </text>
                <text className="scenario-packed-bubble-value" textAnchor="middle" y={12}>
                  {share}%
                </text>
                <title>{`${bubble.label}: ${formatCurrency(bubble.value)} (${share}% of allocated budget)`}</title>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="scenario-packed-bubble-footnote">
        Bubble area approximates intervention budget weight. Use this view for quick dominance checks before detailed Sankey tracing.
      </div>
    </article>
  );
}
