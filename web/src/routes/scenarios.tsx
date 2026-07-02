import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { MathBlock } from "../components/math-block";
import { PersonaFlowRail } from "../components/persona-flow-rail";
import { ScenarioPackedBubbleCard } from "../components/scenario-packed-bubble-card";
import { ScenarioSankeyCard } from "../components/scenario-sankey-card";
import { ScienceDemocratizationBanner } from "../components/science-democratization-banner";
import { StoryJourneyStrip } from "../components/story-journey-strip";
import { SunburstCard } from "../components/sunburst-card";
import { createWhatIfScenarios, getCityBenchmarkSuite, getCityExperience, getCityPlannerValidation, getCitySpectral, getRobustnessLab, listCities, listCostSources, listInterventions, listRuns, listScenarios, queueRun, resetAndGenerateScenarios } from "../lib/api";
import { personaModeProfiles, personaScenarioPresets } from "../lib/persona-modes";
import { useActivePersonaMode } from "../lib/use-active-persona-mode";
import type { CostSource, InterventionRecord, PlanningMode, RobustnessLab, RunRecord, ScenarioRecord } from "../lib/types";

const columnHelper = createColumnHelper<ScenarioRecord>();

function evidenceScore(scenario: ScenarioRecord): number {
  return (scenario.evidenceSummary.verifiedUnitCostCount * 100)
    + (scenario.evidenceSummary.rankingOnlyCount * 10)
    + scenario.evidenceSummary.benchmarkOnlyCount;
}

function evidenceTone(status: string): "observed" | "derived" | "estimated" | "illustrative" {
  if (status === "verified_unit_cost") return "observed";
  if (status === "ranking_only") return "derived";
  if (status === "benchmark_only") return "estimated";
  return "illustrative";
}

function evidenceLabel(status: string) {
  return status.replaceAll("_", " ");
}

function planningModeLabel(mode: PlanningMode) {
  if (mode === "best_under_budget") return "Best under budget";
  if (mode === "evidence_first") return "Evidence first";
  if (mode === "benchmark_share") return "Benchmark share";
  return "Whole-city benchmark";
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

function scenarioParetoWhy(point: {
  frontier: boolean;
  isBestAffordable: boolean;
  isCurrent: boolean;
  costUsd: number;
  benefitC: number;
  scenario: ScenarioRecord;
}, bestAffordable: { costUsd: number; benefitC: number } | null) {
  const coveragePct = Math.round(point.scenario.allocationSummary.allocationCoveragePct * 100);
  const verified = point.scenario.evidenceSummary.verifiedUnitCostCount;
  const rankingOnly = point.scenario.evidenceSummary.rankingOnlyCount;
  const benchmarkOnly = point.scenario.evidenceSummary.benchmarkOnlyCount;
  const evidenceSentence = `${verified} verified, ${rankingOnly} ranking-only, ${benchmarkOnly} benchmark-only actions`;
  if (point.isBestAffordable) {
    return `It is the strongest affordable tradeoff on the frontier: at $${point.costUsd.toLocaleString()} it delivers ${point.benefitC.toFixed(2)}°C eq. modeled benefit, ${coveragePct}% coverage, and ${evidenceSentence}.`;
  }
  if (point.frontier) {
    return `It remains on the frontier because no cheaper saved scenario matches its modeled benefit. The mix stays efficient with ${coveragePct}% coverage and ${evidenceSentence}.`;
  }
  if (bestAffordable) {
    return `It is useful as a contrast point, but a better affordable scenario exists at $${bestAffordable.costUsd.toLocaleString()} with ${bestAffordable.benefitC.toFixed(2)}°C eq. modeled benefit.`;
  }
  return `It is a contrast point for the scenario set, but not the strongest affordable tradeoff under the current budget.`;
}

function scenarioValuePerDollar(point: { costUsd: number; benefitC: number }) {
  if (point.costUsd <= 0) {
    return 0;
  }
  return point.benefitC / point.costUsd;
}

function scenarioParetoComparison(
  best: { costUsd: number; benefitC: number },
  runnerUp: { costUsd: number; benefitC: number } | null,
) {
  if (!runnerUp) {
    return "No second affordable frontier point is available to compare against yet.";
  }
  const costDelta = best.costUsd - runnerUp.costUsd;
  const benefitDelta = best.benefitC - runnerUp.benefitC;
  const bestRatio = scenarioValuePerDollar(best);
  const runnerRatio = scenarioValuePerDollar(runnerUp);
  const ratioDelta = bestRatio - runnerRatio;
  if (costDelta === 0) {
    return `It matches the next best affordable option on cost and adds ${benefitDelta.toFixed(2)}°C eq. modeled benefit, while the benefit-per-dollar ratio shifts by ${(ratioDelta * 100000).toFixed(3)}°C per $100k.`;
  }
  if (costDelta > 0) {
    return `Compared with the next best affordable option at $${runnerUp.costUsd.toLocaleString()}, it spends $${costDelta.toLocaleString()} more to gain ${benefitDelta.toFixed(2)}°C eq. of modeled benefit, and the benefit-per-dollar ratio changes by ${(ratioDelta * 100000).toFixed(3)}°C per $100k.`;
  }
  return `Compared with the next best affordable option at $${runnerUp.costUsd.toLocaleString()}, it saves $${Math.abs(costDelta).toLocaleString()} and still leads by ${benefitDelta.toFixed(2)}°C eq. modeled benefit, with a benefit-per-dollar shift of ${(ratioDelta * 100000).toFixed(3)}°C per $100k.`;
}

function scenarioConfidenceProxy(scenario: ScenarioRecord, heatProof: ScenarioHeatProof | undefined) {
  const evidence = scenario.evidenceSummary;
  const evidenceCount = Math.max(1, evidence.verifiedUnitCostCount + evidence.rankingOnlyCount + evidence.benchmarkOnlyCount);
  const verifiedShare = evidence.verifiedUnitCostCount / evidenceCount;
  const rankingShare = evidence.rankingOnlyCount / evidenceCount;
  const benchmarkShare = evidence.benchmarkOnlyCount / evidenceCount;
  const coverageShare = scenario.allocationSummary.allocationCoveragePct;
  const uncertainty = heatProof?.uncertainty ?? 0.30;
  const scenarioConfidence = scenario.confidence ?? 0.55;
  return clamp01(
    (scenarioConfidence * 0.40)
      + ((0.35 + (verifiedShare * 0.45) + (coverageShare * 0.20) - (benchmarkShare * 0.10)) * 0.35)
      + ((1 - uncertainty) * 0.25)
      - (rankingShare * 0.02),
  );
}

function scenarioConfidenceAdjustedScore(scenario: ScenarioRecord, heatProof: ScenarioHeatProof | undefined) {
  const costUsd = Math.max(1, scenario.budgetUsd);
  const lowerBoundBenefit = Math.max(0, heatProof?.lowerImpactC ?? scenario.heatReductionC ?? 0);
  const confidence = scenarioConfidenceProxy(scenario, heatProof);
  return (lowerBoundBenefit * confidence) / costUsd;
}

function formatDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;
}

type ScenarioHeatContribution = {
  interventionId: string;
  name: string;
  contributionC: number;
  impactWeight: number;
  evidenceWeight: number;
  priorityWeight: number;
  layerWeight: number;
  budgetWeight: number;
  formula: string;
};

type ScenarioHeatProof = {
  totalImpactC: number;
  lowerImpactC: number;
  upperImpactC: number;
  uncertainty: number;
  totalImpactWeight: number;
  structuralGain: number;
  formula: string;
  note: string;
  contributions: ScenarioHeatContribution[];
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function interventionEvidenceWeight(action: ScenarioRecord["recommendedActions"][number]) {
  if (action.costStatus === "verified_unit_cost") return 1;
  if (action.costStatus === "ranking_only") return 0.68;
  return 0.45;
}

function interventionLayerWeight(action: ScenarioRecord["recommendedActions"][number]) {
  const text = `${action.category} ${action.name} ${action.allocationBasis} ${action.rationale}`.toLowerCase();
  if (text.includes("tree") || text.includes("canopy") || text.includes("plant") || text.includes("green")) return 1;
  if (text.includes("shade")) return 0.92;
  if (text.includes("roof") || text.includes("reflect") || text.includes("surface")) return 0.84;
  if (text.includes("cooling") || text.includes("center") || text.includes("node") || text.includes("access")) return 0.78;
  return 0.65;
}

function interventionPriorityWeight(action: ScenarioRecord["recommendedActions"][number], totalActions: number) {
  if (totalActions <= 1) {
    return 1;
  }
  const rank = action.priorityRank ?? totalActions;
  return clamp01(1 - ((Math.max(1, rank) - 1) / Math.max(1, totalActions - 1)));
}

function interventionBudgetWeight(action: ScenarioRecord["recommendedActions"][number]) {
  const budget = Math.max(0, action.allocatedBudgetUsd ?? 0);
  const scale = Math.log1p(budget / 5000);
  return clamp01(scale / Math.log1p(200000 / 5000));
}

function percolationGain(robustnessLab: RobustnessLab | undefined) {
  if (!robustnessLab || robustnessLab.baselinePercolation.length === 0 || robustnessLab.interventionPercolation.length === 0) {
    return 0;
  }
  const base = robustnessLab.baselinePercolation.reduce((sum, value) => sum + value, 0) / robustnessLab.baselinePercolation.length;
  const next = robustnessLab.interventionPercolation.reduce((sum, value) => sum + value, 0) / robustnessLab.interventionPercolation.length;
  return next - base;
}

function scenarioStructuralGain(robustnessLab: RobustnessLab | undefined) {
  if (!robustnessLab) {
    return 0.18;
  }
  const lambda2Gain = robustnessLab.lambda2Intervention - robustnessLab.lambda2Baseline;
  const reliabilityGain = robustnessLab.reliabilityIntervention - robustnessLab.reliabilityBaseline;
  const percolation = percolationGain(robustnessLab);
  const normalizedLambda2Gain = robustnessLab.lambda2Baseline > 0 ? lambda2Gain / robustnessLab.lambda2Baseline : 0;
  return Math.max(0.05, (normalizedLambda2Gain * 0.50) + (reliabilityGain * 0.30) + (percolation * 0.20));
}

function scenarioHeatProof(scenario: ScenarioRecord, robustnessLab: RobustnessLab | undefined): ScenarioHeatProof {
  const actions = [...scenario.recommendedActions].sort((left, right) => {
    const leftPriority = left.priorityRank ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = right.priorityRank ?? Number.MAX_SAFE_INTEGER;
    return leftPriority - rightPriority;
  });
  if (!actions.length) {
    return {
      totalImpactC: 0,
      lowerImpactC: 0,
      upperImpactC: 0,
      uncertainty: 0,
      totalImpactWeight: 0,
      structuralGain: scenarioStructuralGain(robustnessLab),
      formula: "\\Delta T_{\\mathrm{proxy}} = \\alpha \\cdot R \\cdot \\sum_i \\Bigl(w_{\\mathrm{budget},i} \\cdot w_{\\mathrm{evidence},i} \\cdot w_{\\mathrm{priority},i} \\cdot w_{\\mathrm{layer},i}\\Bigr)",
      note: "No recommended actions are attached to this scenario.",
      contributions: [],
    };
  }

  const structuralGain = scenarioStructuralGain(robustnessLab);
  const rawContributions = actions.map((action) => {
    const evidenceWeight = interventionEvidenceWeight(action);
    const priorityWeight = interventionPriorityWeight(action, actions.length);
    const layerWeight = interventionLayerWeight(action);
    const budgetWeight = interventionBudgetWeight(action);
    const impactWeight = evidenceWeight * priorityWeight * layerWeight * budgetWeight;
    return {
      interventionId: action.interventionId,
      name: action.name,
      impactWeight,
      evidenceWeight,
      priorityWeight,
      layerWeight,
      budgetWeight,
      formula: `w_i = ${budgetWeight.toFixed(2)} \\cdot ${evidenceWeight.toFixed(2)} \\cdot ${priorityWeight.toFixed(2)} \\cdot ${layerWeight.toFixed(2)}`,
    };
  });
  const totalImpactWeight = rawContributions.reduce((sum, item) => sum + item.impactWeight, 0);
  const alpha = 3.25;
  const totalImpactC = structuralGain * alpha * totalImpactWeight;
  const evidence = scenario.evidenceSummary;
  const evidenceCount = Math.max(1, evidence.verifiedUnitCostCount + evidence.rankingOnlyCount + evidence.benchmarkOnlyCount);
  const uncertainty = clamp01(
    0.14
      + ((evidence.rankingOnlyCount / evidenceCount) * 0.10)
      + ((evidence.benchmarkOnlyCount / evidenceCount) * 0.18)
      + ((1 - (evidence.verifiedUnitCostCount / evidenceCount)) * 0.08),
  );
  const lowerImpactC = Math.max(0, totalImpactC * (1 - uncertainty));
  const upperImpactC = totalImpactC * (1 + uncertainty);
  const contributions = rawContributions.map((item) => ({
    ...item,
    contributionC: totalImpactWeight > 0 ? totalImpactC * (item.impactWeight / totalImpactWeight) : 0,
  }));

  return {
    totalImpactC,
    lowerImpactC,
    upperImpactC,
    uncertainty,
    totalImpactWeight,
    structuralGain,
    formula: `\\Delta T_{\\mathrm{proxy}} = ${alpha.toFixed(2)} \\cdot R \\cdot \\sum_i \\Bigl(w_{\\mathrm{budget},i} \\cdot w_{\\mathrm{evidence},i} \\cdot w_{\\mathrm{priority},i} \\cdot w_{\\mathrm{layer},i}\\Bigr)`,
    note: "This is a rigorously weighted proxy, not a city-calibrated causal temperature proof. The band reflects evidence mix and therefore widens when the scenario leans more on ranking-only or benchmark-only actions.",
    contributions,
  };
}

function budgetIntensity(budgetUsd: number) {
  const minBudget = 50000;
  const maxBudget = 1000000;
  const clamped = Math.max(minBudget, Math.min(maxBudget, Math.max(0, budgetUsd || 0)));
  return Math.log1p(clamped / minBudget) / Math.log1p(maxBudget / minBudget);
}

type ScenarioBudgetCurvePoint = {
  budgetUsd: number;
  estimatedImpactC: number;
  lowerImpactC: number;
  upperImpactC: number;
  scale: number;
};

type ScenarioParetoPoint = {
  scenario: ScenarioRecord;
  costUsd: number;
  benefitC: number;
  heatBenefitC: number;
  equityBenefit: number;
  benefitScore: number;
  frontier: boolean;
};

function scenarioFrontierHeatBenefit(scenario: ScenarioRecord, heatProof: ScenarioHeatProof | undefined) {
  return scenario.heatReductionC ?? heatProof?.totalImpactC ?? 0;
}

function scenarioFrontierEquityBenefit(scenario: ScenarioRecord) {
  return scenario.equityScore ?? 0;
}

function scenarioFrontierScore(scenario: ScenarioRecord, heatProof: ScenarioHeatProof | undefined) {
  const heat = scenarioFrontierHeatBenefit(scenario, heatProof);
  const equity = scenarioFrontierEquityBenefit(scenario);
  return (heat * 1.0) + (equity * 0.8);
}

const SUNBURST_COLOR_FALLBACKS = [
  "#0f766e", // teal
  "#2563eb", // blue
  "#4f46e5", // indigo
  "#7c3aed", // violet
  "#d97706", // amber
  "#059669", // emerald
  "#0284c7", // sky
  "#db2777", // rose
  "#475569", // slate
];

const SUNBURST_CATEGORY_COLORS: Record<string, string> = {
  "urban forestry": "#0f766e",
  "building cooling": "#2563eb",
  "surface cooling": "#d97706",
  "public-realm shade": "#7c3aed",
  "vertical greening": "#059669",
  default: "#0f766e",
};

function stableColorIndex(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash) % SUNBURST_COLOR_FALLBACKS.length;
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

function normalizeSunburstColor(color: string, seed: string) {
  const trimmed = color.trim();
  const luminance = colorLuminance(trimmed);
  if (!trimmed || trimmed === "#fff" || trimmed === "#ffffff" || luminance > 190) {
    return SUNBURST_COLOR_FALLBACKS[stableColorIndex(seed)];
  }
  return trimmed;
}

function darkenHex(color: string, amount = 0.08) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return color;
  }
  const scale = (channel: number) => Math.max(0, Math.min(255, Math.round(channel * (1 - amount))));
  return `#${[scale(rgb.r), scale(rgb.g), scale(rgb.b)].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function sunburstFill(color: string, seed: string, amount = 0.08) {
  return normalizeSunburstColor(darkenHex(color, amount), seed);
}

function categorySunburstHue(category: string, seed: string) {
  const normalized = category.trim().toLowerCase();
  const baseColor = SUNBURST_CATEGORY_COLORS[normalized] ?? SUNBURST_CATEGORY_COLORS.default;
  return normalizeSunburstColor(baseColor, seed);
}

function scenarioActionHue(action: ScenarioRecord["recommendedActions"][number], index: number) {
  const text = `${action.category} ${action.name} ${action.allocationBasis} ${action.rationale}`.toLowerCase();
  let color = categorySunburstHue(action.category, `${action.category}-${action.interventionId}`);
  if (text.includes("tree") || text.includes("canopy") || text.includes("plant")) color = "#0f766e";
  else if (text.includes("shade")) color = "#7c3aed";
  else if (text.includes("roof") || text.includes("reflect")) color = "#2563eb";
  else if (text.includes("pavement") || text.includes("paving") || text.includes("surface")) color = "#d97706";
  else if (text.includes("cooling") || text.includes("access") || text.includes("center") || text.includes("node")) color = "#db2777";
  else if (text.includes("water") || text.includes("fountain") || text.includes("mist")) color = "#0284c7";
  else if (action.costStatus === "verified_unit_cost") color = "#2563eb";
  else if (action.costStatus === "benchmark_only") color = "#0f766e";
  else color = SUNBURST_COLOR_FALLBACKS[stableColorIndex(`${action.category}-${action.interventionId}`)];

  const shift = index % 3 === 0 ? 0.04 : index % 3 === 1 ? 0.1 : 0.16;
  return normalizeSunburstColor(darkenHex(color, shift), `${action.category}-${action.interventionId}`);
}

function scenarioActionShortLabel(action: ScenarioRecord["recommendedActions"][number]) {
  const segments = action.name.split(/\s+/).filter(Boolean);
  if (segments.length <= 3 && action.name.length <= 22) {
    return action.name;
  }
  return segments.slice(0, 3).join(" ");
}

function scenarioSunburstNodes(scenario: ScenarioRecord) {
  const evidence = scenario.evidenceSummary;
  const evidenceChildren = [
    {
      id: `${scenario.id}-evidence-verified`,
      label: "Verified",
      value: Math.max(1, evidence.verifiedUnitCostCount),
      color: sunburstFill("#059669", `${scenario.id}-evidence-verified`, 0.03),
      tone: "observed" as const,
      detail: `${evidence.verifiedUnitCostCount} verified unit-cost action${evidence.verifiedUnitCostCount === 1 ? "" : "s"}.`,
    },
    {
      id: `${scenario.id}-evidence-ranking`,
      label: "Ranked",
      value: Math.max(1, evidence.rankingOnlyCount),
      color: sunburstFill("#2563eb", `${scenario.id}-evidence-ranking`, 0.03),
      tone: "derived" as const,
      detail: `${evidence.rankingOnlyCount} ranking-only action${evidence.rankingOnlyCount === 1 ? "" : "s"} guided by comparative ordering.`,
    },
    {
      id: `${scenario.id}-evidence-benchmark`,
      label: "Bench",
      value: Math.max(1, evidence.benchmarkOnlyCount),
      color: sunburstFill("#d97706", `${scenario.id}-evidence-benchmark`, 0.03),
      tone: "estimated" as const,
      detail: `${evidence.benchmarkOnlyCount} benchmark-only action${evidence.benchmarkOnlyCount === 1 ? "" : "s"} tied to the whole-city anchor.`,
    },
  ];

  const groupedActions = new Map<string, {
    id: string;
    label: string;
    value: number;
    color: string;
    detail: string;
    tone: "observed" | "derived" | "estimated" | "illustrative";
    children: Array<{
      id: string;
      label: string;
      value: number;
      color: string;
      detail: string;
      tone: "observed" | "derived" | "estimated" | "illustrative";
    }>;
  }>();

  scenario.recommendedActions.forEach((action, index) => {
    const category = action.category?.trim() || "Actions";
    const groupId = `${scenario.id}-portfolio-${category.replace(/\s+/g, "-").toLowerCase()}`;
    const actionValue = 1;
    const color = scenarioActionHue(action, index);
    const group = groupedActions.get(groupId) ?? {
      id: groupId,
      label: category,
      value: 0,
      color: categorySunburstHue(category, groupId),
      detail: `${category} interventions chosen for this scenario.`,
      tone: action.costStatus === "verified_unit_cost" ? "observed" : action.costStatus === "benchmark_only" ? "estimated" : "derived",
      children: [],
    };
    group.value += actionValue;
    group.children.push({
      id: `${scenario.id}-portfolio-${index}-${action.interventionId}`,
      label: scenarioActionShortLabel(action),
      value: actionValue,
      color,
      detail: [
        action.name,
        `Priority: ${action.priorityRank ?? "unranked"}`,
        actionCostLabel(action),
      ].join(" · "),
      tone: action.costStatus === "verified_unit_cost" ? "observed" : action.costStatus === "benchmark_only" ? "estimated" : "derived",
    });
    groupedActions.set(groupId, group);
  });

  const actionGroups = Array.from(groupedActions.values()).sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));

  return [
    {
      id: `${scenario.id}-evidence`,
      label: "Evidence",
      value: evidenceChildren.reduce((sum, item) => sum + item.value, 0),
      color: "#083344",
      tone: "derived" as const,
      detail: "Inner evidence ring: verified rows, ranking-only comparisons, and benchmark anchors.",
      children: evidenceChildren,
    },
    {
      id: `${scenario.id}-portfolio`,
      label: "Intervention portfolio",
      value: Math.max(1, scenario.recommendedActions.length),
      color: "#0f172a",
      tone: "derived" as const,
      detail: "Outer portfolio ring: intervention families and individual recommended actions.",
      children: actionGroups.map((group) => ({
        id: group.id,
        label: group.label,
        value: group.value,
        color: group.color,
        tone: group.tone,
        detail: group.detail,
        children: group.children,
      })),
    },
  ];
}

function scenarioBudgetCurve(
  scenario: ScenarioRecord | null,
  heatProof: ScenarioHeatProof | undefined,
): ScenarioBudgetCurvePoint[] {
  if (!scenario || !heatProof) {
    return [];
  }

  const anchorBudget = Math.max(1, scenario.budgetUsd);
  const anchorIntensity = Math.max(0.25, budgetIntensity(anchorBudget));
  const budgets = [50000, 100000, 250000, 500000, 1000000];

  return budgets.map((budgetUsd) => {
    const nextIntensity = budgetIntensity(budgetUsd);
    const relativeLift = Math.pow(nextIntensity / anchorIntensity, 0.85);
    const scale = Math.max(0.35, Math.min(1.7, 0.45 + (0.55 * relativeLift)));
    const estimatedImpactC = Number((heatProof.totalImpactC * scale).toFixed(2));
    const lowerImpactC = Number(Math.max(0, estimatedImpactC * (1 - heatProof.uncertainty)).toFixed(2));
    const upperImpactC = Number((estimatedImpactC * (1 + heatProof.uncertainty)).toFixed(2));
    return {
      budgetUsd,
      estimatedImpactC,
      lowerImpactC,
      upperImpactC,
      scale,
    };
  });
}

function scenarioParetoFrontier(
  scenarios: ScenarioRecord[],
  heatProofByScenario: Map<string, ScenarioHeatProof>,
): ScenarioParetoPoint[] {
  const points = scenarios.map((scenario) => ({
    scenario,
    costUsd: Math.max(1, scenario.budgetUsd),
    benefitC: Math.max(0, scenarioFrontierHeatBenefit(scenario, heatProofByScenario.get(scenario.id))),
    heatBenefitC: Math.max(0, scenarioFrontierHeatBenefit(scenario, heatProofByScenario.get(scenario.id))),
    equityBenefit: Math.max(0, scenarioFrontierEquityBenefit(scenario)),
    benefitScore: Math.max(0, scenarioFrontierScore(scenario, heatProofByScenario.get(scenario.id))),
    frontier: false,
  }));

  return points
    .map((point) => ({
      ...point,
      frontier: !points.some((other) => (
        other !== point
        && other.costUsd <= point.costUsd
        && other.heatBenefitC >= point.heatBenefitC
        && other.equityBenefit >= point.equityBenefit
        && (
          other.costUsd < point.costUsd
          || other.heatBenefitC > point.heatBenefitC
          || other.equityBenefit > point.equityBenefit
        )
      )),
    }))
    .sort((left, right) => left.costUsd - right.costUsd || right.benefitScore - left.benefitScore);
}

export function ScenariosPage() {
  const { activeModeId } = useActivePersonaMode();
  const modeProfile = personaModeProfiles[activeModeId];
  const modePreset = personaScenarioPresets[activeModeId];
  const search = useSearch({ from: "/scenarios" });
  const queryClient = useQueryClient();
  const [cityId, setCityId] = useState(search.cityId ?? "boston");
  const [budgetUsd, setBudgetUsd] = useState(search.budgetUsd ?? 250000);
  const [planningMode, setPlanningMode] = useState<PlanningMode>("best_under_budget");
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [runStatusFilter, setRunStatusFilter] = useState<"all" | RunRecord["status"]>("all");
  const [paretoFocusedScenarioId, setParetoFocusedScenarioId] = useState<string | null>(null);
  const [paretoHoveredScenarioId, setParetoHoveredScenarioId] = useState<string | null>(null);
  const paretoTooltipRef = useRef<HTMLDivElement | null>(null);
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: listCities });
  const experienceQuery = useQuery({ queryKey: ["city-experience", cityId], queryFn: () => getCityExperience(cityId) });
  const spectralQuery = useQuery({ queryKey: ["city-spectral", cityId], queryFn: () => getCitySpectral(cityId) });
  const benchmarkSuiteQuery = useQuery({ queryKey: ["city-benchmark-suite", cityId], queryFn: () => getCityBenchmarkSuite(cityId) });
  const plannerValidationQuery = useQuery({ queryKey: ["planner-validation", cityId], queryFn: () => getCityPlannerValidation(cityId) });
  const robustnessQuery = useQuery({ queryKey: ["robustness-lab"], queryFn: getRobustnessLab });
  const costSourcesQuery = useQuery({ queryKey: ["cost-sources"], queryFn: listCostSources });
  const interventionsQuery = useQuery({ queryKey: ["interventions"], queryFn: listInterventions });
  const scenariosQuery = useQuery({ queryKey: ["scenarios", cityId], queryFn: () => listScenarios(cityId) });
  const runsQuery = useQuery({ queryKey: ["runs", cityId], queryFn: () => listRuns(cityId) });
  const [lastQueuedRun, setLastQueuedRun] = useState<{ id: string; scenario: string } | null>(null);
  const evidenceThreshold = modeProfile.evidenceThreshold;
  const createScenarioMutation = useMutation({
    mutationFn: ({ nextCityId, nextBudgetUsd, nextOptions }: {
      nextCityId: string;
      nextBudgetUsd: number;
      nextOptions?: { label?: string; presetKey?: string | null; planningMode?: PlanningMode };
    }) => createWhatIfScenarios(nextCityId, nextBudgetUsd, nextOptions),
    onSuccess: async (scenario, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["scenarios", variables.nextCityId] });
      setCityId(variables.nextCityId);
      setBudgetUsd(variables.nextBudgetUsd);
      setSubmissionError(null);
      if (variables.nextOptions?.presetKey) {
        setSubmissionMessage(`Created ${scenario.label} from the reusable starter set.`);
        return;
      }
      setSubmissionMessage(`Created ${scenario.label} in ${planningModeLabel(variables.nextOptions?.planningMode ?? "best_under_budget")} mode.`);
    },
    onError: (error) => {
      setSubmissionMessage(null);
      setSubmissionError(error instanceof Error ? error.message : "Scenario generation failed.");
    },
  });
  const resetScenarioMutation = useMutation({
    mutationFn: ({ nextCityId, nextBudgetUsd, nextOptions }: {
      nextCityId: string;
      nextBudgetUsd: number;
      nextOptions?: { label?: string; presetKey?: string | null; planningMode?: PlanningMode };
    }) => resetAndGenerateScenarios(nextCityId, nextBudgetUsd, nextOptions),
    onSuccess: async (result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["scenarios", variables.nextCityId] });
      setCityId(variables.nextCityId);
      setBudgetUsd(variables.nextBudgetUsd);
      setSubmissionError(null);
      setSubmissionMessage(`Cleared ${result.clearedCount} saved scenario${result.clearedCount === 1 ? "" : "s"} and regenerated ${result.scenario.label}.`);
    },
    onError: (error) => {
      setSubmissionMessage(null);
      setSubmissionError(error instanceof Error ? error.message : "Scenario reset failed.");
    },
  });
  const queueRunMutation = useMutation({
    mutationFn: ({ nextCityId, scenarioLabel }: { nextCityId: string; scenarioLabel: string }) => queueRun(nextCityId, scenarioLabel),
    onSuccess: (run) => {
      setLastQueuedRun({ id: run.id, scenario: run.scenario });
    },
  });

  useEffect(() => {
    if (search.cityId && search.cityId !== cityId) {
      setCityId(search.cityId);
    }
    if (typeof search.budgetUsd === "number" && search.budgetUsd !== budgetUsd) {
      setBudgetUsd(search.budgetUsd);
    }
  }, [budgetUsd, cityId, search.budgetUsd, search.cityId]);

  useEffect(() => {
    setPlanningMode(modePreset.planningMode);
    if (!search.cityId) {
      setCityId(modePreset.cityId);
    }
    if (typeof search.budgetUsd !== "number") {
      setBudgetUsd(modePreset.budgetUsd);
    }
  }, [modePreset.budgetUsd, modePreset.cityId, modePreset.planningMode, search.budgetUsd, search.cityId]);

  const allScenarios = scenariosQuery.data ?? [];
  const filteredScenarios = useMemo(() => {
    return allScenarios.filter((scenario) => {
      const readinessLabel = scenario.evidenceSummary.readinessLabel.toLowerCase();
      const readinessAllowed = evidenceThreshold.requireReadinessKeyword
        ? readinessLabel.includes(evidenceThreshold.requireReadinessKeyword.toLowerCase())
        : true;
      return (
        scenario.evidenceSummary.verifiedUnitCostCount >= evidenceThreshold.minVerifiedUnitCostActions
        && scenario.evidenceSummary.benchmarkOnlyCount <= evidenceThreshold.maxBenchmarkOnlyActions
        && readinessAllowed
      );
    });
  }, [allScenarios, evidenceThreshold.maxBenchmarkOnlyActions, evidenceThreshold.minVerifiedUnitCostActions, evidenceThreshold.requireReadinessKeyword]);

  const columns = useMemo(() => [
    columnHelper.accessor("label", { header: "Scenario" }),
    columnHelper.accessor("planningMode", { header: "Mode", cell: (info) => planningModeLabel(info.getValue()) }),
    columnHelper.accessor("budgetUsd", { header: "Budget", cell: (info) => `$${info.getValue().toLocaleString()}` }),
    columnHelper.accessor("evidenceSummary.readinessLabel", { header: "Evidence readiness" }),
    columnHelper.accessor("benchmarkSummary.benchmarkLabel", { header: "Benchmark gap" }),
    columnHelper.accessor("estimatedCostUsd", { header: "Estimated cost", cell: (info) => {
      const value = info.getValue();
      return value == null ? "Not available yet" : `$${value.toLocaleString()}`;
    } }),
    columnHelper.accessor("heatReductionC", { header: "Heat reduction", cell: (info) => {
      const value = info.getValue();
      return value == null ? "Not available yet" : `${value.toFixed(1)}°C`;
    } }),
    columnHelper.accessor("equityScore", { header: "Equity", cell: (info) => {
      const value = info.getValue();
      return value == null ? "Not available yet" : value.toFixed(2);
    } }),
    columnHelper.accessor("confidence", { header: "Confidence", cell: (info) => {
      const value = info.getValue();
      return value == null ? "Not available yet" : `${Math.round(value * 100)}%`;
    } }),
  ], []);

  const table = useReactTable({
    data: filteredScenarios,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const comparison = useMemo(() => {
    const scenarios = filteredScenarios;
    if (scenarios.length === 0) {
      return null;
    }
    const byEvidence = [...scenarios].sort((left, right) => evidenceScore(right) - evidenceScore(left))[0];
    const byCoverage = [...scenarios].sort(
      (left, right) => right.allocationSummary.allocationCoveragePct - left.allocationSummary.allocationCoveragePct,
    )[0];
    const byBenchmarkGap = [...scenarios].sort((left, right) => {
      const leftGap = left.benchmarkSummary.budgetGapUsd ?? Number.POSITIVE_INFINITY;
      const rightGap = right.benchmarkSummary.budgetGapUsd ?? Number.POSITIVE_INFINITY;
      return leftGap - rightGap;
    })[0];
    return { byEvidence, byCoverage, byBenchmarkGap };
  }, [filteredScenarios]);
  const budgetCurveScenario = useMemo(() => {
    const scenarios = filteredScenarios;
    if (scenarios.length === 0) {
      return null;
    }
    const exactMatch = scenarios.find((scenario) => scenario.planningMode === planningMode && scenario.budgetUsd === budgetUsd);
    if (exactMatch) {
      return exactMatch;
    }
    const sameMode = [...scenarios]
      .filter((scenario) => scenario.planningMode === planningMode)
      .sort((left, right) => Math.abs(left.budgetUsd - budgetUsd) - Math.abs(right.budgetUsd - budgetUsd))[0];
    if (sameMode) {
      return sameMode;
    }
    return comparison?.byCoverage ?? comparison?.byEvidence ?? scenarios[0];
  }, [budgetUsd, comparison, filteredScenarios, planningMode]);
  const verifiedUnitCostCount = useMemo(
    () => (interventionsQuery.data ?? []).filter((item) => item.costStatus === "verified_unit_cost").length,
    [interventionsQuery.data],
  );
  const robustnessLab = robustnessQuery.data as RobustnessLab | undefined;
  const robustnessDeltas = robustnessLab ? {
    lambda2: robustnessLab.lambda2Intervention - robustnessLab.lambda2Baseline,
    reliability: robustnessLab.reliabilityIntervention - robustnessLab.reliabilityBaseline,
    conductance: robustnessLab.phiBaseline - robustnessLab.phiIntervention,
  } : null;
  const heatProofByScenario = useMemo(
    () => new Map(filteredScenarios.map((scenario) => [scenario.id, scenarioHeatProof(scenario, robustnessLab)])),
    [filteredScenarios, robustnessLab],
  );
  const confidenceComparison = useMemo(() => {
    if (filteredScenarios.length === 0) {
      return null;
    }
    const scored = filteredScenarios.map((scenario) => {
      const heatProof = heatProofByScenario.get(scenario.id);
      return {
        scenario,
        heatProof,
        confidenceProxy: scenarioConfidenceProxy(scenario, heatProof),
        confidenceAdjustedScore: scenarioConfidenceAdjustedScore(scenario, heatProof),
      };
    });
    const byConfidence = [...scored].sort((left, right) => right.confidenceProxy - left.confidenceProxy)[0];
    const byAdjustedValue = [...scored].sort((left, right) => right.confidenceAdjustedScore - left.confidenceAdjustedScore)[0];
    const byTightestBand = [...scored]
      .filter((item) => item.heatProof)
      .sort((left, right) => (left.heatProof?.uncertainty ?? Number.POSITIVE_INFINITY) - (right.heatProof?.uncertainty ?? Number.POSITIVE_INFINITY))[0] ?? null;
    const byStrongestConservativeBenefit = [...scored]
      .sort((left, right) => (right.heatProof?.lowerImpactC ?? 0) - (left.heatProof?.lowerImpactC ?? 0))[0];
    return { byConfidence, byAdjustedValue, byTightestBand, byStrongestConservativeBenefit };
  }, [filteredScenarios, heatProofByScenario]);
  const bestHeatProxyScenario = useMemo(
    () => [...filteredScenarios].filter((scenario) => scenario.heatReductionC != null).sort((left, right) => (right.heatReductionC ?? 0) - (left.heatReductionC ?? 0))[0] ?? null,
    [filteredScenarios],
  );
  const bestEquityProxyScenario = useMemo(
    () => [...filteredScenarios].filter((scenario) => scenario.equityScore != null).sort((left, right) => (right.equityScore ?? 0) - (left.equityScore ?? 0))[0] ?? null,
    [filteredScenarios],
  );
  const budgetCurve = useMemo(
    () => scenarioBudgetCurve(budgetCurveScenario, budgetCurveScenario ? heatProofByScenario.get(budgetCurveScenario.id) : undefined),
    [budgetCurveScenario, heatProofByScenario],
  );
  const paretoFrontier = useMemo(
    () => scenarioParetoFrontier(filteredScenarios, heatProofByScenario),
    [filteredScenarios, heatProofByScenario],
  );
  const paretoPlot = useMemo(() => {
    if (!paretoFrontier.length) {
      return null;
    }
    const xValues = paretoFrontier.map((point) => Math.log10(point.costUsd));
    const yValues = paretoFrontier.map((point) => point.benefitC);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    const width = 1000;
    const height = 540;
    const padding = { top: 44, right: 48, bottom: 68, left: 76 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const xSpan = Math.max(0.001, maxX - minX);
    const ySpan = Math.max(0.001, maxY - minY);
    const scaleX = (value: number) => padding.left + ((value - minX) / xSpan) * plotWidth;
    const scaleY = (value: number) => padding.top + (1 - ((value - minY) / ySpan)) * plotHeight;
    const points = paretoFrontier.map((point) => ({
      ...point,
      x: scaleX(Math.log10(point.costUsd)),
      y: scaleY(point.benefitC),
      isCurrent: point.scenario.budgetUsd === budgetUsd && point.scenario.planningMode === planningMode,
    }));
    const affordable = points.filter((point) => point.costUsd <= budgetUsd);
    const bestAffordable = affordable.length
      ? affordable.reduce((best, point) => (
        point.benefitC > best.benefitC || (point.benefitC === best.benefitC && point.costUsd < best.costUsd)
          ? point
          : best
      ))
      : null;
    const bestAffordableId = bestAffordable?.scenario.id ?? null;
    const decoratedPoints = points.map((point) => ({
      ...point,
      isBestAffordable: point.scenario.id === bestAffordableId,
    }));
    const frontier = decoratedPoints.filter((point) => point.frontier);
    const frontierPath = frontier.length
      ? frontier
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
        .join(" ")
      : "";
    return {
      width,
      height,
      padding,
      minX,
      maxX,
      minY,
      maxY,
      points: decoratedPoints,
      frontier,
      frontierPath,
      bestAffordableId,
      xTicks: [50000, 100000, 250000, 500000, 1000000].map((value) => ({
        value,
        x: scaleX(Math.log10(value)),
      })),
      yTicks: Array.from({ length: 5 }, (_, index) => {
        const value = minY + ((ySpan / 4) * index);
        return {
          value,
          y: scaleY(value),
        };
      }).reverse(),
    };
  }, [budgetUsd, paretoFrontier, planningMode]);
  const bestAffordableParetoPoint = useMemo(
    () => paretoPlot?.points.find((point) => point.isBestAffordable) ?? null,
    [paretoPlot],
  );
  const nextBestAffordableParetoPoint = useMemo(() => {
    if (!paretoPlot || !bestAffordableParetoPoint) {
      return null;
    }
    return paretoPlot.points
      .filter((point) => point.costUsd <= budgetUsd && point.scenario.id !== bestAffordableParetoPoint.scenario.id)
      .sort((left, right) => {
        if (right.benefitC !== left.benefitC) {
          return right.benefitC - left.benefitC;
        }
        return left.costUsd - right.costUsd;
      })[0] ?? null;
  }, [bestAffordableParetoPoint, budgetUsd, paretoPlot]);
  const bestAffordableComparison = useMemo(
    () => scenarioParetoComparison(bestAffordableParetoPoint ? {
      costUsd: bestAffordableParetoPoint.costUsd,
      benefitC: bestAffordableParetoPoint.benefitC,
    } : { costUsd: 0, benefitC: 0 }, nextBestAffordableParetoPoint ? {
      costUsd: nextBestAffordableParetoPoint.costUsd,
      benefitC: nextBestAffordableParetoPoint.benefitC,
    } : null),
    [bestAffordableParetoPoint, nextBestAffordableParetoPoint],
  );
  const activeParetoPoint = useMemo(() => {
    if (!paretoPlot) {
      return null;
    }
    const activeId = paretoHoveredScenarioId
      ?? paretoFocusedScenarioId
      ?? paretoPlot.points.find((point) => point.isCurrent)?.scenario.id
      ?? paretoPlot.points[0]?.scenario.id
    ?? null;
    return paretoPlot.points.find((point) => point.scenario.id === activeId) ?? null;
  }, [paretoFocusedScenarioId, paretoHoveredScenarioId, paretoPlot]);
  const activeParetoWhy = useMemo(
    () => (activeParetoPoint ? scenarioParetoWhy(activeParetoPoint, bestAffordableParetoPoint) : null),
    [activeParetoPoint, bestAffordableParetoPoint],
  );

  useEffect(() => {
    if (!paretoTooltipRef.current || !paretoPlot || !activeParetoPoint) {
      return;
    }
    paretoTooltipRef.current.style.setProperty("--pareto-left", `${(activeParetoPoint.x / paretoPlot.width) * 100}%`);
    paretoTooltipRef.current.style.setProperty("--pareto-top", `${(activeParetoPoint.y / paretoPlot.height) * 100}%`);
  }, [activeParetoPoint, paretoPlot]);
  const activeSunburstScenario = activeParetoPoint?.scenario
    ?? bestAffordableParetoPoint?.scenario
    ?? filteredScenarios[0]
    ?? allScenarios[0]
    ?? null;
  const activeSunburstNodes = useMemo(
    () => (activeSunburstScenario ? scenarioSunburstNodes(activeSunburstScenario) : []),
    [activeSunburstScenario],
  );
  const activeScenarioHierarchy = useMemo(() => {
    if (!activeSunburstScenario) {
      return null;
    }
    const heatProof = heatProofByScenario.get(activeSunburstScenario.id);
    return {
      evidence: [
        `${activeSunburstScenario.evidenceSummary.verifiedUnitCostCount} verified unit-cost action${activeSunburstScenario.evidenceSummary.verifiedUnitCostCount === 1 ? "" : "s"}`,
        `${activeSunburstScenario.evidenceSummary.rankingOnlyCount} ranking-only action${activeSunburstScenario.evidenceSummary.rankingOnlyCount === 1 ? "" : "s"}`,
        `${activeSunburstScenario.evidenceSummary.benchmarkOnlyCount} benchmark-only action${activeSunburstScenario.evidenceSummary.benchmarkOnlyCount === 1 ? "" : "s"}`,
      ],
      budget: [
        `$${activeSunburstScenario.allocationSummary.totalAllocatedBudgetUsd.toLocaleString()} allocated`,
        `$${activeSunburstScenario.allocationSummary.unallocatedBudgetUsd.toLocaleString()} unallocated`,
        `${Math.round(activeSunburstScenario.allocationSummary.allocationCoveragePct * 100)}% coverage`,
      ],
      benefit: [
        activeSunburstScenario.heatReductionC == null ? "Heat proxy not set" : `${activeSunburstScenario.heatReductionC.toFixed(2)}°C proxy heat reduction`,
        activeSunburstScenario.equityScore == null ? "Equity proxy not set" : `${activeSunburstScenario.equityScore.toFixed(2)} equity proxy`,
        heatProof ? `${Math.round((1 - heatProof.uncertainty) * 100)}% certainty proxy` : "No uncertainty band",
      ],
    };
  }, [activeSunburstScenario, heatProofByScenario]);

  useEffect(() => {
    if (!paretoPlot) {
      return;
    }
    const current = paretoPlot.points.find((point) => point.isCurrent)?.scenario.id ?? paretoPlot.points[0]?.scenario.id ?? null;
    if (current && !paretoFocusedScenarioId) {
      setParetoFocusedScenarioId(current);
    }
    if (paretoFocusedScenarioId && !paretoPlot.points.some((point) => point.scenario.id === paretoFocusedScenarioId)) {
      setParetoFocusedScenarioId(current);
    }
  }, [paretoFocusedScenarioId, paretoPlot]);

  const recentRuns = useMemo(
    () => [...(runsQuery.data ?? [])]
      .filter((run: RunRecord) => runStatusFilter === "all" || run.status === runStatusFilter)
      .sort((left: RunRecord, right: RunRecord) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, 4),
    [runsQuery.data, runStatusFilter],
  );
  const groupedRuns = useMemo(() => {
    const groups = new Map<string, RunRecord[]>();
    for (const run of (runsQuery.data ?? []).filter((item: RunRecord) => runStatusFilter === "all" || item.status === runStatusFilter)) {
      const current = groups.get(run.scenario) ?? [];
      current.push(run);
      groups.set(run.scenario, current);
    }
    return Array.from(groups.entries()).map(([scenario, runs]) => ({
      scenario,
      runs: runs.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
      summary: {
        queued: runs.filter((run) => run.status === "queued").length,
        running: runs.filter((run) => run.status === "running").length,
        succeeded: runs.filter((run) => run.status === "succeeded").length,
        failed: runs.filter((run) => run.status === "failed").length,
        latestUpdatedAt: runs.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]?.updatedAt ?? null,
        averageProgress: runs.length > 0 ? Math.round(runs.reduce((sum, run) => sum + run.progress, 0) / runs.length) : 0,
        maxProgress: runs.length > 0 ? Math.max(...runs.map((run) => run.progress)) : 0,
      },
    }));
  }, [runsQuery.data, runStatusFilter]);

  return (
    <section className="page-stack scenario-page">
      <div className="scenario-page-hero">
        <div className="scenario-hero-copy">
          <header className="section-heading scenario-page-heading">
            <div>
              <div className="eyebrow">Scenario engine</div>
              <h1>Review spectral evidence and verified cost benchmarks.</h1>
            </div>
            <p>{spectralQuery.data?.summary ?? "Use one guided page to test a budget, compare options, and keep the evidence trail visible without sending users across a maze of specialist screens."}</p>
          </header>
        </div>

        {activeScenarioHierarchy ? (
          <article className="panel-card nested-card premium-scenario-card scenario-hero-summary scenario-page-summary">
            <div className="scenario-hero-summary-head">
              <div>
                <div className="eyebrow">At a glance</div>
                <h2>{activeSunburstScenario?.label ?? "Active scenario"}</h2>
                <p className="muted">
                  A compact summary of the active scenario keeps the opening readout anchored while the visual gallery below shows the decision structure.
                </p>
              </div>
              <div className="truth-badge derived">
                {Math.round((activeSunburstScenario?.allocationSummary.allocationCoveragePct ?? 0) * 100)}% coverage
              </div>
            </div>
            <div className="scenario-hero-summary-grid">
              <div>
                <strong>Evidence</strong>
                {activeScenarioHierarchy.evidence.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div>
                <strong>Budget</strong>
                {activeScenarioHierarchy.budget.map((item) => <span key={item}>{item}</span>)}
              </div>
              <div>
                <strong>Benefit</strong>
                {activeScenarioHierarchy.benefit.map((item) => <span key={item}>{item}</span>)}
              </div>
            </div>
          </article>
        ) : null}
      </div>

      <section className="scenario-story-deck" aria-label="Scenario narrative stages">
        <article className="scenario-story-card">
          <span>01</span>
          <strong>Frame the problem</strong>
          <p>Start with mode-specific evidence thresholds and city context so tradeoffs are scoped before optimization begins.</p>
        </article>
        <article className="scenario-story-card">
          <span>02</span>
          <strong>Read composition</strong>
          <p>Use sunburst for hierarchy, then packed bubbles for quick budget concentration and intervention dominance checks.</p>
        </article>
        <article className="scenario-story-card">
          <span>03</span>
          <strong>Trace budget causality</strong>
          <p>The Sankey reveals where dollars move from evidence quality into intervention families and top actions.</p>
        </article>
        <article className="scenario-story-card">
          <span>04</span>
          <strong>Decide and audit</strong>
          <p>Generate, compare, and export with confidence-aware rankings and explicit uncertainty bands.</p>
        </article>
      </section>

      <nav className="scenario-story-nav" aria-label="Scenario page sections">
        <a href="#scenario-composition">Composition</a>
        <a href="#scenario-bubbles">Packed bubbles</a>
        <a href="#scenario-sankey">Budget flow</a>
        <a href="#scenario-generator">Generator</a>
        <a href="#scenario-math-proof">Math proof</a>
        <a href="#scenario-table">Scenario table</a>
        <a href="#scenario-audit">Audit</a>
      </nav>

      <StoryJourneyStrip
        title="Scenario decision storyline"
        subtitle="The page is organized to keep science legible: composition, budget flow, constrained optimization, then audit-ready comparison."
        items={[
          { label: "Compose", detail: "Read evidence and intervention composition in the sunburst before selecting budgets." },
          { label: "Scan", detail: "Use packed bubbles for immediate intervention budget dominance and concentration checks." },
          { label: "Trace", detail: "Follow budget causality with Sankey from evidence quality into intervention families." },
          { label: "Optimize", detail: "Generate and compare scenarios with confidence-aware, uncertainty-bounded metrics." },
          { label: "Audit", detail: "Inspect planner validation, run history, and provenance before decisions leave the room." },
        ]}
        className="scenario-story-journey"
      />

      <section className="scenario-view-rationale panel-card premium-section-card" aria-label="Why three visual views">
        <div className="scenario-view-rationale-head">
          <div>
            <div className="eyebrow">Why three visual lenses</div>
            <h2>Each chart answers a different planning question</h2>
            <p className="muted">
              Keeping Sunburst, Packed bubbles, and Sankey together follows progressive disclosure patterns from the reference set:
              overview first, concentration second, causality third.
            </p>
          </div>
          <div className="truth-badge derived">helper-backed</div>
        </div>
        <div className="scenario-view-rationale-grid">
          <article>
            <strong>Sunburst: hierarchy and evidence structure</strong>
            <p>Best for understanding composition and evidence layering before users reason about budget flows.</p>
            <span>
              Uses helpers for arc geometry, hierarchy weighting, readable color fallback, and stable detail focus.
            </span>
          </article>
          <article>
            <strong>Packed bubbles: concentration and dominance</strong>
            <p>Best for seeing which interventions dominate allocated budget without trace-path complexity.</p>
            <span>
              Uses helpers for budget weighting, non-overlap packing, category color mapping, and compact top-N filtering.
            </span>
          </article>
          <article>
            <strong>Sankey: causality and budget provenance</strong>
            <p>Best for tracing how budget moves from evidence quality to intervention families and actions.</p>
            <span>
              Uses helpers for staged node construction, column layout, link path routing, and evidence-aware flow styling.
            </span>
          </article>
        </div>
      </section>

      <div className="scenario-visual-gallery" id="scenario-composition">
        {activeSunburstScenario ? (
          <SunburstCard
            title="Scenario composition sunburst"
            description="The center keeps the scenario story in view while the rings separate the evidence that supports it from the intervention portfolio it proposes."
            centerLabel="Scenario"
            centerDetail={activeSunburstScenario.summary}
            centerMeta={`${planningModeLabel(activeSunburstScenario.planningMode)} · ${Math.round(activeSunburstScenario.allocationSummary.allocationCoveragePct * 100)}% coverage`}
            nodes={activeSunburstNodes}
            className="scenario-sunburst-card--hero scenario-sunburst-card--lede"
          />
        ) : null}

        {activeSunburstScenario ? (
          <div id="scenario-bubbles">
            <ScenarioPackedBubbleCard scenario={activeSunburstScenario} />
          </div>
        ) : null}
      </div>

      {activeSunburstScenario ? (
        <section className="scenario-sankey-stage" id="scenario-sankey">
          <div className="scenario-sankey-stage-head">
            <div>
              <div className="eyebrow">Decision story centerpiece</div>
              <h2>Follow every budget dollar from evidence to intervention family</h2>
              <p className="muted">
                This Sankey now lives on its own row so the flow can be read without compression: budget origin, evidence quality split, and intervention-family destination stay visible in a single scan.
              </p>
            </div>
            <div className="scenario-sankey-stage-pills">
              <span>{planningModeLabel(activeSunburstScenario.planningMode)}</span>
              <span>{Math.round(activeSunburstScenario.allocationSummary.allocationCoveragePct * 100)}% coverage</span>
              <span>{activeSunburstScenario.evidenceSummary.readinessLabel}</span>
            </div>
          </div>
          <ScenarioSankeyCard
            scenario={activeSunburstScenario}
            title="Budget flow Sankey"
            description="Trace the scenario budget through evidence quality and intervention families, then inspect top actions with source-aware context."
            className="scenario-sankey-card--stage"
          />
        </section>
      ) : null}

      <PersonaFlowRail activeModeId={activeModeId} currentRoute="/scenarios" />

      <ScienceDemocratizationBanner />

      <div className="scenario-insight-grid" id="scenario-context">
      <article className="panel-card premium-section-card scenario-support-card">
        <div className="mode-suite-header">
          <div>
            <div className="eyebrow">Active mode preset</div>
            <h2>{modeProfile.label} defaults for scenario science</h2>
            <p className="muted">{modeProfile.scienceAnchor}</p>
          </div>
          <div className="mode-suite-badge">
            <span>Evidence goal</span>
            <strong>{modePreset.evidenceGoal}</strong>
          </div>
        </div>
        <div className="mode-quick-facts">
          <div>
            <strong>Preset city</strong>
            <span>{modePreset.cityId}</span>
          </div>
          <div>
            <strong>Preset budget</strong>
            <span>${modePreset.budgetUsd.toLocaleString()}</span>
          </div>
          <div>
            <strong>Preset planning mode</strong>
            <span>{planningModeLabel(modePreset.planningMode)}</span>
          </div>
          <div>
            <strong>Evidence threshold</strong>
            <span>
              min verified {evidenceThreshold.minVerifiedUnitCostActions} · max benchmark-only {evidenceThreshold.maxBenchmarkOnlyActions}
            </span>
          </div>
        </div>
        <div className="quick-links">
          <button
            type="button"
            className="button-link secondary"
            onClick={() => {
              setCityId(modePreset.cityId);
              setBudgetUsd(modePreset.budgetUsd);
              setPlanningMode(modePreset.planningMode);
              setSubmissionMessage(`${modeProfile.label} preset applied: ${modePreset.cityId}, $${modePreset.budgetUsd.toLocaleString()}, ${planningModeLabel(modePreset.planningMode)}.`);
              setSubmissionError(null);
            }}
          >
            Apply mode preset
          </button>
        </div>
          <p className="muted">
            Showing {filteredScenarios.length} of {allScenarios.length} scenario{allScenarios.length === 1 ? "" : "s"} after applying {modeProfile.label.toLowerCase()} evidence rules.
          </p>
      </article>

      <article className="panel-card premium-section-card benchmark-suite-card scenario-support-card">
        <div className="mode-suite-header">
          <div>
            <div className="eyebrow">Benchmark suite</div>
            <h2>{benchmarkSuiteQuery.data?.cityName ?? "Boston"} planning snapshot</h2>
            <p className="muted">
              Canonical budgets keep the current planner behavior easy to inspect and compare without opening a separate tooling page.
            </p>
          </div>
          <div className="mode-suite-badge">
            <span>Cases</span>
            <strong>{benchmarkSuiteQuery.data?.cases.length ?? 0}</strong>
          </div>
        </div>
        <div className="mode-suite-grid">
          {(benchmarkSuiteQuery.data?.cases ?? []).slice(0, 3).map((item) => (
            <article key={item.id} className={`mode-suite-card tone-${item.planningMode}`}>
              <div className="eyebrow">{item.label}</div>
              <h3>${item.budgetUsd.toLocaleString()}</h3>
              <p>{item.benchmarkLabel}</p>
              <p className="muted">{item.sourceNote}</p>
              <div className="mode-suite-stats">
                <div>
                  <span>Mode</span>
                  <strong>{planningModeLabel(item.planningMode)}</strong>
                </div>
                <div>
                  <span>Actions</span>
                  <strong>{item.actionCount}</strong>
                </div>
                <div>
                  <span>Coverage</span>
                  <strong>{Math.round(item.allocationCoveragePct * 100)}%</strong>
                </div>
                <div>
                  <span>Exhaustive</span>
                  <strong>{item.exhaustiveAvailable ? "Ready" : "Partial"}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="quick-links">
          <Link to="/modes" className="button-link secondary">Open modes</Link>
        </div>
      </article>
      </div>

      {search.focus ? (
        <article className="panel-card premium-section-card">
          <h2>Map carry-over</h2>
          <p className="muted">
            Brought forward from the city map so scenario work stays anchored to the selected research target instead of starting from a blank slate.
          </p>
          <div className="panel-grid two-col">
            <div className="panel-card nested-card premium-scenario-card">
              <div className="eyebrow">{search.sourceLayer ?? "map layer"}</div>
              <h3>{search.focus}</h3>
              <p className="muted">
                {search.selectedLabel
                  ? `Selected area: ${search.selectedLabel}.`
                  : "No specific area label was carried over."}
              </p>
              <p className="muted">
                Suggested planning city: {cityId}. Suggested benchmark budget: ${budgetUsd.toLocaleString()}.
              </p>
            </div>
            <div className="panel-card nested-card premium-scenario-card">
              <div className="eyebrow">Use this for</div>
              <h3>Scenario focus prompt</h3>
              <p className="muted">
                Treat this as a guided starting point for mitigation planning around the mapped condition, not as a claim that the optimizer is already fully targeted to one polygon.
              </p>
            </div>
          </div>
        </article>
      ) : null}

      {experienceQuery.data?.starterScenarios.length ? (
        <article className="panel-card premium-section-card">
          <h2>{experienceQuery.data.cityName} starter scenarios</h2>
          <p className="muted">
            {experienceQuery.data.summary}
          </p>
          <div className="panel-grid two-col">
            {experienceQuery.data.starterScenarios.map((preset) => (
              <div key={preset.key} className="panel-card nested-card premium-scenario-card">
                <div className="eyebrow">{experienceQuery.data.bundled ? "Bundled starter" : "Reusable starter"}</div>
                <h3>{preset.label}</h3>
                <p>{preset.description}</p>
                <p className="muted">Budget: ${preset.budgetUsd.toLocaleString()}</p>
                <div className="quick-links">
                  <button
                    className="button-link secondary"
                    type="button"
                    onClick={() => {
                      setBudgetUsd(preset.budgetUsd);
                      setSubmissionMessage(`Loaded ${preset.label} for ${experienceQuery.data.cityName}.`);
                    }}
                  >
                    Load preset
                  </button>
                  <button
                    className="button-link"
                    type="button"
                    disabled={createScenarioMutation.isPending}
                    onClick={async () => {
                      setSubmissionMessage(null);
                      setSubmissionError(null);
                      createScenarioMutation.mutate({
                        nextCityId: cityId,
                        nextBudgetUsd: preset.budgetUsd,
                        nextOptions: {
                          label: `${experienceQuery.data.cityName} ${preset.label}`,
                          presetKey: preset.key,
                          planningMode,
                        },
                      });
                    }}
                  >
                    {createScenarioMutation.isPending ? "Generating..." : "Generate now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      ) : null}

      <div className="scenario-decision-stack premium-story-grid">
        <article className="panel-card premium-section-card scenario-story-table" id="scenario-generator">
          <h2>What-if generator</h2>
          <p className="muted">Choose a city, set a budget, and generate a scenario without overpromising what the evidence can support.</p>
          <p className="muted">Verified unit-cost rows currently loaded: {verifiedUnitCostCount}.</p>
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmissionMessage(null);
              setSubmissionError(null);
              createScenarioMutation.mutate({
                nextCityId: cityId,
                nextBudgetUsd: budgetUsd,
                nextOptions: { planningMode },
              });
            }}
          >
            <label>
              City
              <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
                {(citiesQuery.data ?? []).map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </label>
            <label>
              Budget USD
              <input
                type="number"
                value={budgetUsd}
                onChange={(e) => setBudgetUsd(Number(e.target.value))}
                min={1}
                step={1000}
              />
            </label>
            <label>
              Planning mode
              <select value={planningMode} onChange={(event) => setPlanningMode(event.target.value as PlanningMode)}>
                <option value="best_under_budget">Best under budget</option>
                <option value="evidence_first">Evidence first</option>
                <option value="benchmark_share">Benchmark share</option>
                <option value="whole_city_benchmark">Whole-city benchmark</option>
              </select>
            </label>
            <button className="button-link" type="submit" disabled={createScenarioMutation.isPending}>
              {createScenarioMutation.isPending ? "Generating..." : "Generate what-if"}
            </button>
            <button
              className="button-link secondary"
              type="button"
              disabled={createScenarioMutation.isPending || resetScenarioMutation.isPending}
              onClick={async () => {
                setSubmissionMessage(null);
                setSubmissionError(null);
                resetScenarioMutation.mutate({
                  nextCityId: cityId,
                  nextBudgetUsd: budgetUsd,
                  nextOptions: { planningMode },
                });
              }}
            >
              {resetScenarioMutation.isPending ? "Resetting..." : "Reset scenarios and regenerate"}
            </button>
          </form>
          {submissionMessage ? <p className="muted">{submissionMessage}</p> : null}
          {submissionError ? <p className="muted">{submissionError}</p> : null}
          {lastQueuedRun ? (
            <p className="muted">
              Queued run for {lastQueuedRun.scenario}. <Link to="/runs/$runId" params={{ runId: lastQueuedRun.id }}>Open run detail</Link>
            </p>
          ) : null}
        </article>
        <article className="panel-card premium-section-card" id="scenario-math-proof">
          <h2>Why the math justifies the placement</h2>
          <p className="muted">
            The placement is grounded in the same graph pipeline that ranks bottlenecks and cooling gaps. We use a weighted urban graph, the normalized Laplacian, a Fiedler-vector Cheeger sweep, and a constrained placement score so every action sits near the strongest evidence while still staying separated across the city.
          </p>
          <div className="scenario-proof-layout">
            <div className="scenario-proof-column">
              <div className="scenario-proof-card">
                <div className="eyebrow">Graph model</div>
                <MathBlock tex="L = D - A" className="scenario-proof-formula" />
                <p>Adjacency and degree matrices define the weighted urban graph. Stronger edges mean stronger connectivity between neighboring pixels.</p>
              </div>
              <div className="scenario-proof-card">
                <div className="eyebrow">Normalized form</div>
                <MathBlock tex="L_{\\mathrm{norm}} = D^{-1/2}(D - A)D^{-1/2}" className="scenario-proof-formula" />
                <p>This makes the eigen-analysis scale-aware, so the map ranking is not biased by simple node count or raw degree.</p>
              </div>
              <div className="scenario-proof-card">
                <div className="eyebrow">Cheeger step</div>
                <MathBlock tex="\\phi(S) = \\frac{\\operatorname{cut}(S, V\\setminus S)}{\\min(\\operatorname{vol}(S), \\operatorname{vol}(V\\setminus S))}" className="scenario-proof-formula" />
                <p>We sweep the Fiedler vector and choose the cut that minimizes conductance, which is the formal bottleneck objective.</p>
              </div>
            </div>
            <div className="scenario-proof-column">
              <div className="scenario-proof-card scenario-proof-card-accent">
                <div className="eyebrow">Proof sketch</div>
                <p>
                  The selected interventions are not placed by color or intuition alone. They inherit the bottleneck score from the spectral layer, then earn additional placement weight from action priority, match to the heat/cooling layer, and separation from previously placed interventions.
                </p>
                <p>
                  The result is a greedy maximization of a transparent placement score, so the map has an explicit reason for each location instead of a hidden heuristic.
                </p>
              </div>
              <div className="scenario-proof-card">
                <div className="eyebrow">Probability layer</div>
                <p>
                  Monte Carlo edge-retention trials approximate how robust the network remains under random failures. Sink-reliability sampling checks whether the cooling-access network still reaches relief points.
                </p>
              </div>
              <div className="scenario-proof-card">
                <div className="eyebrow">Combinatorics</div>
                <p>
                  The intervention choice is a bounded subset search over verified and ranked actions. In the repo, that is the closest thing to a formal selection proof we currently have.
                </p>
              </div>
            </div>
          </div>
          <div className="scenario-metric-grid scenario-proof-metrics">
            <div className="map-badge">
              <strong>{robustnessLab ? formatDelta(robustnessDeltas?.lambda2 ?? 0) : "—"}</strong>
              <p>Δlambda2</p>
            </div>
            <div className="map-badge">
              <strong>{robustnessLab ? formatDelta(robustnessDeltas?.conductance ?? 0) : "—"}</strong>
              <p>Δconductance</p>
            </div>
            <div className="map-badge">
              <strong>{robustnessLab ? formatDelta(robustnessDeltas?.reliability ?? 0) : "—"}</strong>
              <p>Δreliability</p>
            </div>
            <div className="map-badge">
              <strong>Not validated</strong>
              <p>Heat drop</p>
            </div>
          </div>
          <div className="scenario-analytics-grid">
          {budgetCurve.length ? (
            <div className="scenario-budget-curve-card scenario-analytics-card">
              <div className="scenario-budget-curve-head">
                <div>
                  <div className="eyebrow">Budget response curve</div>
                  <h3>{budgetCurveScenario?.label ?? "Scenario"} at current planning mode</h3>
                  <p className="muted">
                    The model should not stay flat when budget rises. This curve uses the same weighted scenario proof and shows the projected gain at a few budget anchors.
                  </p>
                </div>
                <div className={`truth-badge ${budgetCurveScenario?.exhaustiveEstimateSummary.available ? "observed" : "estimated"}`}>
                  {budgetCurveScenario?.budgetUsd == null ? "Budget sweep" : `$${budgetCurveScenario.budgetUsd.toLocaleString()} anchor`}
                </div>
              </div>
              <div className="scenario-budget-curve-list">
                {budgetCurve.map((point) => (
                  <div key={point.budgetUsd} className={`scenario-budget-curve-row ${point.budgetUsd === budgetUsd ? "active" : ""}`}>
                    <div className="scenario-budget-curve-label">
                      <span>${point.budgetUsd.toLocaleString()}</span>
                      <strong>{point.estimatedImpactC.toFixed(2)}°C</strong>
                    </div>
                    <div className="scenario-budget-curve-track">
                      <progress className="scenario-budget-curve-meter" max={100} value={Math.max(12, Math.min(100, (point.estimatedImpactC / Math.max(0.01, budgetCurve[budgetCurve.length - 1]?.estimatedImpactC ?? 1)) * 100))} />
                    </div>
                    <div className="scenario-budget-curve-note">
                      <span>{point.lowerImpactC.toFixed(2)}°C to {point.upperImpactC.toFixed(2)}°C</span>
                      <span>Lift {(point.scale * 100).toFixed(0)}% of anchor</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="scenario-budget-curve-footnote">
                Current budget: ${budgetUsd.toLocaleString()}.
                Higher budgets buy broader coverage and stronger structural gain, but the curve still tapers because the model includes diminishing returns.
              </p>
            </div>
          ) : null}
          {paretoPlot ? (
            <div className="scenario-pareto-card scenario-analytics-card">
              <div className="scenario-pareto-head">
                <div>
                  <div className="eyebrow">Scenario Pareto frontier</div>
                  <h3>Cost vs modeled benefit across saved scenarios</h3>
                  <p className="muted">
                    Frontier points are non-dominated on both proxy heat reduction and proxy equity. A point is on the frontier when no cheaper scenario matches or exceeds both.
                  </p>
                </div>
                <div className="scenario-pareto-meta">
                  <span>Saved scenarios</span>
                  <strong>{paretoPlot.points.length}</strong>
                </div>
              </div>
              {bestAffordableParetoPoint ? (
                <div className="scenario-pareto-callout">
                  <div className="scenario-pareto-callout-ribbon">
                    <span className="scenario-pareto-callout-ribbon-line" />
                    <span className="scenario-pareto-callout-ribbon-label">Best tradeoff right now</span>
                    <span className="scenario-pareto-callout-ribbon-line" />
                  </div>
                  <div className="scenario-pareto-callout-label">
                    <strong>{bestAffordableParetoPoint.scenario.label}</strong>
                    <span className="scenario-pareto-callout-score">{bestAffordableParetoPoint.benefitC.toFixed(2)}°C eq.</span>
                  </div>
                  <div className="scenario-pareto-callout-stats">
                    <span>${bestAffordableParetoPoint.costUsd.toLocaleString()}</span>
                    <span>{Math.round(bestAffordableParetoPoint.scenario.allocationSummary.allocationCoveragePct * 100)}% coverage</span>
                    <span>{bestAffordableParetoPoint.scenario.evidenceSummary.readinessLabel}</span>
                  </div>
                  <p>{scenarioParetoWhy(bestAffordableParetoPoint, bestAffordableParetoPoint)}</p>
                  <p className="scenario-pareto-callout-comparison">{bestAffordableComparison}</p>
                </div>
              ) : null}
              <div className="scenario-pareto-svg-wrap">
                {paretoPlot && activeParetoPoint ? (
                  <div
                    ref={paretoTooltipRef}
                    className="scenario-pareto-tooltip"
                  >
                    <div className="scenario-pareto-tooltip-head">
                      <strong>{activeParetoPoint.scenario.label}</strong>
                      <span className={activeParetoPoint.frontier ? "is-frontier" : "is-dimmed"}>
                        {activeParetoPoint.frontier ? "Frontier" : "Dominated"}
                      </span>
                    </div>
                    <div className="scenario-pareto-tooltip-grid">
                      <div>
                        <span>Cost</span>
                        <strong>${activeParetoPoint.costUsd.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span>Modeled benefit</span>
                        <strong>{activeParetoPoint.benefitC.toFixed(2)}°C eq.</strong>
                      </div>
                      <div>
                        <span>Coverage</span>
                        <strong>{Math.round(activeParetoPoint.scenario.allocationSummary.allocationCoveragePct * 100)}%</strong>
                      </div>
                      <div>
                        <span>Evidence</span>
                        <strong>{activeParetoPoint.scenario.evidenceSummary.readinessLabel}</strong>
                      </div>
                    </div>
                  </div>
                ) : null}
                <svg viewBox={`0 0 ${paretoPlot.width} ${paretoPlot.height}`} role="img" aria-label="Scenario Pareto frontier chart">
                  <defs>
                    <linearGradient id="paretoFrontierStroke" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0f766e" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" width={paretoPlot.width} height={paretoPlot.height} rx="24" fill="rgba(255,255,255,0.84)" />
                  {paretoPlot.yTicks.map((tick) => (
                    <g key={`y-${tick.value}`}>
                      <line x1={paretoPlot.padding.left} x2={paretoPlot.width - paretoPlot.padding.right} y1={tick.y} y2={tick.y} className="scenario-pareto-gridline" />
                      <text x={20} y={tick.y + 4} className="scenario-pareto-axis-label">{tick.value.toFixed(1)}°C</text>
                    </g>
                  ))}
                  {paretoPlot.xTicks.map((tick) => (
                    <g key={`x-${tick.value}`}>
                      <line x1={tick.x} x2={tick.x} y1={paretoPlot.padding.top} y2={paretoPlot.height - paretoPlot.padding.bottom} className="scenario-pareto-gridline" />
                      <text x={tick.x} y={paretoPlot.height - 20} className="scenario-pareto-axis-label is-x">{`$${tick.value.toLocaleString()}`}</text>
                    </g>
                  ))}
                  <line
                    x1={paretoPlot.padding.left}
                    x2={paretoPlot.width - paretoPlot.padding.right}
                    y1={paretoPlot.padding.top}
                    y2={paretoPlot.padding.top}
                    className="scenario-pareto-axis"
                  />
                  <line
                    x1={paretoPlot.padding.left}
                    x2={paretoPlot.padding.left}
                    y1={paretoPlot.padding.top}
                    y2={paretoPlot.height - paretoPlot.padding.bottom}
                    className="scenario-pareto-axis"
                  />
                  {paretoPlot.frontierPath ? <path d={paretoPlot.frontierPath} className="scenario-pareto-frontier-path" /> : null}
                  {paretoPlot.points.map((point) => (
                    <g
                      key={point.scenario.id}
                      transform={`translate(${point.x}, ${point.y})`}
                      onMouseEnter={() => setParetoHoveredScenarioId(point.scenario.id)}
                      onMouseLeave={() => setParetoHoveredScenarioId(null)}
                      onFocus={() => setParetoHoveredScenarioId(point.scenario.id)}
                      onBlur={() => setParetoHoveredScenarioId(null)}
                      onClick={() => setParetoFocusedScenarioId(point.scenario.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${point.scenario.label}, ${point.costUsd.toLocaleString()} dollars, ${point.benefitC.toFixed(2)} degrees modeled benefit`}
                      className="scenario-pareto-point-group"
                    >
                      <circle
                        r={point.frontier ? 9 : 6}
                        className={`scenario-pareto-point ${point.frontier ? "is-frontier" : "is-dimmed"} ${point.isCurrent ? "is-current" : ""}`}
                      />
                      <circle
                        r={point.frontier ? 17 : 13}
                        className={`scenario-pareto-ring ${point.isCurrent ? "is-current" : ""} ${point.isBestAffordable ? "is-best-affordable" : ""}`}
                      />
                      <text
                        x={point.frontier ? 14 : 10}
                        y={point.frontier ? -12 : -10}
                        className={`scenario-pareto-point-label ${point.frontier ? "is-frontier" : "is-dimmed"} ${point.isCurrent ? "is-current" : ""} ${point.isBestAffordable ? "is-best-affordable" : ""}`}
                      >
                        {point.scenario.label}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="scenario-pareto-legend">
                <span><i className="scenario-pareto-legend-dot is-frontier" /> Frontier</span>
                <span><i className="scenario-pareto-legend-dot is-dimmed" /> Dominated</span>
                <span><i className="scenario-pareto-legend-dot is-current" /> Current budget</span>
                <span><i className="scenario-pareto-legend-dot is-best" /> Best under budget</span>
              </div>
              <div className="scenario-pareto-summary">
                {paretoPlot.frontier.map((point) => (
                  <div key={point.scenario.id} className={`scenario-pareto-chip ${point.isCurrent ? "is-current" : ""} ${point.isBestAffordable ? "is-best-affordable" : ""}`}>
                    <strong>{point.scenario.label}</strong>
                    <span>${point.costUsd.toLocaleString()} · {point.benefitC.toFixed(2)}°C eq.</span>
                  </div>
                ))}
              </div>
              {activeParetoPoint ? (
                <div className="scenario-pareto-focus">
                  <div className="scenario-pareto-focus-head">
                    <div>
                      <div className="eyebrow">{activeParetoPoint.frontier ? "Frontier" : "Dominated"}</div>
                      <h4>{activeParetoPoint.scenario.label}</h4>
                      <p className="muted">{planningModeLabel(activeParetoPoint.scenario.planningMode)} · {activeParetoPoint.scenario.cityId}</p>
                    </div>
                    <div className={`truth-badge ${activeParetoPoint.frontier ? "observed" : "estimated"}`}>
                      {activeParetoPoint.isBestAffordable
                        ? "Best under budget"
                        : activeParetoPoint.isCurrent
                          ? "Current budget"
                          : `Budget $${activeParetoPoint.costUsd.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="scenario-pareto-focus-grid">
                    <div className="scenario-pareto-focus-metric">
                      <span>Modeled benefit</span>
                      <strong>{activeParetoPoint.benefitC.toFixed(2)}°C eq.</strong>
                    </div>
                    <div className="scenario-pareto-focus-metric">
                      <span>Estimated cost</span>
                      <strong>${activeParetoPoint.costUsd.toLocaleString()}</strong>
                    </div>
                    <div className="scenario-pareto-focus-metric">
                      <span>Coverage</span>
                      <strong>{Math.round(activeParetoPoint.scenario.allocationSummary.allocationCoveragePct * 100)}%</strong>
                    </div>
                    <div className="scenario-pareto-focus-metric">
                      <span>Evidence readiness</span>
                      <strong>{activeParetoPoint.scenario.evidenceSummary.readinessLabel}</strong>
                    </div>
                  </div>
                  {activeParetoWhy ? (
                    <div className="scenario-pareto-rationale">
                      <div className="scenario-pareto-rationale-head">
                        <span className="eyebrow">Why this wins</span>
                        <strong>{activeParetoPoint.isBestAffordable ? "Best under budget" : activeParetoPoint.frontier ? "Frontier tradeoff" : "Comparison point"}</strong>
                      </div>
                      <p>{activeParetoWhy}</p>
                      <div className="scenario-pareto-rationale-pills">
                        <span>{Math.round(activeParetoPoint.scenario.allocationSummary.allocationCoveragePct * 100)}% coverage</span>
                        <span>{activeParetoPoint.scenario.evidenceSummary.readinessLabel}</span>
                        <span>{activeParetoPoint.frontier ? "On the frontier" : "Dominated but visible"}</span>
                      </div>
                    </div>
                  ) : null}
                  <p className="scenario-pareto-focus-copy">
                    {activeParetoPoint.scenario.summary}
                  </p>
                  <div className="quick-links">
                    <button
                      type="button"
                      className="button-link secondary"
                      onClick={() => {
                        setCityId(activeParetoPoint.scenario.cityId);
                        setBudgetUsd(activeParetoPoint.scenario.budgetUsd);
                        setPlanningMode(activeParetoPoint.scenario.planningMode);
                        setSubmissionMessage(`Loaded ${activeParetoPoint.scenario.label} into the generator controls.`);
                      }}
                    >
                      Load into controls
                    </button>
                  </div>
                </div>
              ) : null}
              <p className="scenario-budget-curve-footnote">
                Frontier entries are the saved scenarios that deliver the most modeled benefit for their cost. Lower-right dominated points are still shown above, but they are visually dimmed so the best tradeoff is unmistakable.
              </p>
            </div>
          ) : null}
          </div>
          <p className="map-layer-summary">
            The proof-of-concept robustness lab shows the same style of intervention increasing lambda2, improving sink reliability, and reducing conductance. That is strong evidence that the network becomes harder to sever and easier to cool.
          </p>
          <p className="muted">
            Important: this repository does not yet contain a validated city-specific causal temperature model, so a true °C reduction for Boston scenarios is not proven here. What is proven is the direction of improvement in the graph objective: better connectivity, less vulnerability to cut failure, and higher sink reachability.
          </p>
          {robustnessLab ? (
            <>
              <div className="map-layer-section-title">Robustness lab proof sketch</div>
              <p className="muted">{robustnessLab.summary}</p>
              {robustnessLab.notes.map((note) => (
                <p key={note} className="muted">{note}</p>
              ))}
            </>
          ) : null}
        </article>
        <article className="panel-card premium-section-card" id="scenario-table">
          <h2>Scenario table</h2>
          <p className="muted">This table keeps the main comparison surface visible while unsupported benefit fields stay blank instead of being guessed.</p>
          <div className="table-shell">
            <table>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>{header.isPlaceholder ? null : header.column.columnDef.header as string}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{cell.renderValue() as React.ReactNode}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <details className="panel-card premium-section-card" id="scenario-audit">
        <summary className="premium-summary">Show advanced evidence and audit details</summary>
        <div className="premium-details-stack">
          <article className="panel-card nested-card premium-scenario-card">
            <h2>Scenario provenance</h2>
            <p className="muted">These outputs stay useful by separating observed inputs, derived workflow, benchmark math, and unsupported claims.</p>
            <div className="panel-grid two-col">
              <div className="panel-card nested-card premium-scenario-card">
                <div className="truth-badge observed">Observed inputs</div>
                <p className="muted">Bundled geometry, repository cost-source documents, and stored scenario records are source-backed artifacts.</p>
              </div>
              <div className="panel-card nested-card premium-scenario-card">
                <div className="truth-badge derived">Derived workflow</div>
                <p className="muted">Comparative ranks, readiness labels, and overlay-linked planning context come from the workflow and app logic.</p>
              </div>
              <div className="panel-card nested-card premium-scenario-card">
                <div className="truth-badge estimated">Estimated planning math</div>
                <p className="muted">Budget allocations and benchmark-gap summaries are planning estimates, not procurement-ready engineering quantities.</p>
              </div>
              <div className="panel-card nested-card premium-scenario-card">
                <div className="truth-badge illustrative">Not claimed yet</div>
                <p className="muted">The app still does not claim validated city-specific heat reduction, equity benefit, or exhaustive mitigation costs.</p>
              </div>
            </div>
          </article>

          <article className="panel-card nested-card premium-scenario-card">
            <h2>Planner validation</h2>
            <p className="muted">This validation surface shows what is ready, what is partial, and what should not yet be treated as final policy math.</p>
            {plannerValidationQuery.data ? (
              <>
                <p className="muted">
                  {plannerValidationQuery.data.valid
                    ? `${plannerValidationQuery.data.cityName} passes the minimum planning-data checks for guided use in this app.`
                    : `${plannerValidationQuery.data.cityName} is still missing required pieces for a fully bundled planning workflow.`}
                </p>
                <div className="panel-grid two-col">
                  {plannerValidationQuery.data.checks.map((check) => (
                    <div key={check.id} className="panel-card nested-card premium-scenario-card">
                      <div className="eyebrow">{check.status}</div>
                      <h3>{check.label}</h3>
                      <p>{check.detail}</p>
                    </div>
                  ))}
                </div>
                {plannerValidationQuery.data.errors.length > 0 ? (
                  <div className="panel-card nested-card premium-scenario-card">
                    <div className="eyebrow">Missing</div>
                    {plannerValidationQuery.data.errors.map((error) => <p key={error}>{error}</p>)}
                  </div>
                ) : null}
                {plannerValidationQuery.data.warnings.length > 0 ? (
                  <div className="panel-card nested-card premium-scenario-card">
                    <div className="eyebrow">Warnings</div>
                    {plannerValidationQuery.data.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="muted">Loading planner validation...</p>
            )}
          </article>

          <article className="panel-card nested-card premium-scenario-card">
            <h2>Recent scenario runs</h2>
            <p className="muted">Keep the planning flow tied to execution history so users can see which scenarios actually became runs.</p>
            <div className="quick-links">
              <label className="plan-card-mini">
                <strong>Run status filter</strong>
                <select value={runStatusFilter} onChange={(event) => setRunStatusFilter(event.target.value as typeof runStatusFilter)}>
                  <option value="all">all</option>
                  <option value="queued">queued</option>
                  <option value="running">running</option>
                  <option value="succeeded">succeeded</option>
                  <option value="failed">failed</option>
                </select>
              </label>
            </div>
            {recentRuns.length > 0 ? (
              <div className="panel-grid two-col">
                {recentRuns.map((run) => (
                  <div key={run.id} className="panel-card nested-card premium-scenario-card">
                    <div className="eyebrow">{run.status}</div>
                    <h3>{run.scenario}</h3>
                    <p className="muted">Progress: {run.progress}%</p>
                    <p className="muted">Updated: {run.updatedAt}</p>
                    <div className="quick-links">
                      <Link to="/runs/$runId" params={{ runId: run.id }} className="button-link secondary">Open run</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No runs are attached to this city yet. Queue a run from one of the scenario cards below.</p>
            )}
            {groupedRuns.length > 0 ? (
              <div className="panel-grid two-col">
                {groupedRuns.map((group) => (
                  <div key={group.scenario} className="panel-card nested-card premium-scenario-card">
                    <div className="eyebrow">Scenario group</div>
                    <h3>{group.scenario}</h3>
                    <p className="muted">{group.runs.length} run{group.runs.length === 1 ? "" : "s"} match this scenario label.</p>
                    <p className="muted">Latest status: {group.runs[0]?.status ?? "unknown"}</p>
                    <p className="muted">
                      Queued: {group.summary.queued} | Running: {group.summary.running} | Succeeded: {group.summary.succeeded} | Failed: {group.summary.failed}
                    </p>
                    <p className="muted">
                      Latest update: {group.summary.latestUpdatedAt ?? "unknown"} | Avg progress: {group.summary.averageProgress}% | Max progress: {group.summary.maxProgress}%
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </article>

          <article className="panel-card nested-card premium-scenario-card">
            <h2>Scenario comparison</h2>
            <p className="muted">This comparison layer now includes a confidence proxy and uncertainty band so users can see which scenario is not just strongest, but best supported.</p>
            {comparison && confidenceComparison ? (
              <div className="panel-grid two-col">
                <div className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">Most evidence-ready</div>
                  <h3>{comparison.byEvidence.label}</h3>
                  <p>{comparison.byEvidence.evidenceSummary.explanation}</p>
                  <p className="muted">
                    Verified unit-cost actions: {comparison.byEvidence.evidenceSummary.verifiedUnitCostCount} | Ranking-only actions: {comparison.byEvidence.evidenceSummary.rankingOnlyCount}
                  </p>
                </div>
                <div className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">Best allocation coverage</div>
                  <h3>{comparison.byCoverage.label}</h3>
                  <p>{comparison.byCoverage.allocationSummary.allocationMethod}</p>
                  <p className="muted">
                    Coverage: {Math.round(comparison.byCoverage.allocationSummary.allocationCoveragePct * 100)}% with ${comparison.byCoverage.allocationSummary.unallocatedBudgetUsd.toLocaleString()} unallocated.
                  </p>
                </div>
                <div className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">Closest to whole-city benchmark</div>
                  <h3>{comparison.byBenchmarkGap.label}</h3>
                  <p>{comparison.byBenchmarkGap.benchmarkSummary.explanation}</p>
                  <p className="muted">
                    Remaining benchmark gap: {comparison.byBenchmarkGap.benchmarkSummary.budgetGapUsd == null
                      ? "Not available"
                      : `$${comparison.byBenchmarkGap.benchmarkSummary.budgetGapUsd.toLocaleString()}`}.
                  </p>
                </div>
                <div className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">Largest heat proxy</div>
                  <h3>{bestHeatProxyScenario?.label ?? "No heat proxy available"}</h3>
                  <p className="muted">
                    {bestHeatProxyScenario?.heatReductionC == null
                      ? "No proxy heat-reduction score available yet."
                      : `${bestHeatProxyScenario.heatReductionC.toFixed(2)}°C proxy reduction`}
                  </p>
                </div>
                <div className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">Strongest equity proxy</div>
                  <h3>{bestEquityProxyScenario?.label ?? "No equity proxy available"}</h3>
                  <p className="muted">
                    {bestEquityProxyScenario?.equityScore == null
                      ? "No proxy equity score available yet."
                      : `${bestEquityProxyScenario.equityScore.toFixed(2)} equity proxy`}
                  </p>
                </div>
                <div className="panel-card nested-card premium-scenario-card scenario-comparison-card">
                  <div className="scenario-comparison-head">
                    <strong>Most confident estimate</strong>
                    <span>{Math.round(confidenceComparison.byConfidence.confidenceProxy * 100)}% proxy confidence</span>
                  </div>
                  <h3>{confidenceComparison.byConfidence.scenario.label}</h3>
                  <p className="scenario-comparison-note">
                    {confidenceComparison.byConfidence.heatProof
                      ? `${confidenceComparison.byConfidence.heatProof.lowerImpactC.toFixed(2)}°C to ${confidenceComparison.byConfidence.heatProof.upperImpactC.toFixed(2)}°C eq. modeled benefit band`
                      : "No heat-proof band available for this scenario yet."}
                  </p>
                  <div className="scenario-comparison-bars">
                    <div className="scenario-comparison-row">
                      <div className="scenario-comparison-label">
                        <span>Confidence proxy</span>
                        <strong>{Math.round(confidenceComparison.byConfidence.confidenceProxy * 100)}%</strong>
                      </div>
                      <div className="scenario-comparison-track">
                        <progress className="scenario-comparison-meter is-after" max={100} value={Math.max(12, confidenceComparison.byConfidence.confidenceProxy * 100)} />
                      </div>
                    </div>
                    <div className="scenario-comparison-row">
                      <div className="scenario-comparison-label">
                        <span>Uncertainty width</span>
                        <strong>{confidenceComparison.byConfidence.heatProof ? `${Math.round(confidenceComparison.byConfidence.heatProof.uncertainty * 100)}%` : "—"}</strong>
                      </div>
                      <div className="scenario-comparison-track">
                        <progress className="scenario-comparison-meter is-before" max={100} value={confidenceComparison.byConfidence.heatProof ? Math.max(12, (1 - confidenceComparison.byConfidence.heatProof.uncertainty) * 100) : 12} />
                      </div>
                    </div>
                  </div>
                  <p className="scenario-comparison-note">
                    Confidence proxy is derived from evidence mix, allocation coverage, and the scenario heat-proof uncertainty band. It is not a validated causal guarantee.
                  </p>
                </div>
                <div className="panel-card nested-card premium-scenario-card scenario-comparison-card">
                  <div className="scenario-comparison-head">
                    <strong>Best confidence-adjusted value</strong>
                    <span>{(confidenceComparison.byAdjustedValue.confidenceAdjustedScore * 100000).toFixed(2)}°C eq. / $100k</span>
                  </div>
                  <h3>{confidenceComparison.byAdjustedValue.scenario.label}</h3>
                  <p className="scenario-comparison-note">
                    This discounts the lower-bound modeled benefit by the scenario confidence proxy, so the ranking rewards both plausibility and affordability.
                  </p>
                  <p className="muted">
                    Lower-bound benefit: {confidenceComparison.byAdjustedValue.heatProof ? `${confidenceComparison.byAdjustedValue.heatProof.lowerImpactC.toFixed(2)}°C eq.` : "Not available"} · Proxy confidence: {Math.round(confidenceComparison.byAdjustedValue.confidenceProxy * 100)}%
                  </p>
                </div>
                {confidenceComparison.byTightestBand ? (
                  <div className="panel-card nested-card premium-scenario-card scenario-comparison-card">
                    <div className="scenario-comparison-head">
                      <strong>Tightest uncertainty band</strong>
                      <span>{confidenceComparison.byTightestBand.heatProof ? `${Math.round((1 - confidenceComparison.byTightestBand.heatProof.uncertainty) * 100)}% certainty proxy` : "—"}</span>
                    </div>
                    <h3>{confidenceComparison.byTightestBand.scenario.label}</h3>
                    <p className="scenario-comparison-note">
                      {confidenceComparison.byTightestBand.heatProof
                        ? `${confidenceComparison.byTightestBand.heatProof.lowerImpactC.toFixed(2)}°C to ${confidenceComparison.byTightestBand.heatProof.upperImpactC.toFixed(2)}°C eq. modeled benefit`
                        : "No uncertainty band available yet."}
                    </p>
                  </div>
                ) : null}
                <div className="panel-card nested-card premium-scenario-card scenario-comparison-card">
                  <div className="scenario-comparison-head">
                    <strong>Best conservative payoff</strong>
                    <span>Lower bound focus</span>
                  </div>
                  <h3>{confidenceComparison.byStrongestConservativeBenefit.scenario.label}</h3>
                  <p className="scenario-comparison-note">
                    {confidenceComparison.byStrongestConservativeBenefit.heatProof
                      ? `${confidenceComparison.byStrongestConservativeBenefit.heatProof.lowerImpactC.toFixed(2)}°C lower-bound modeled benefit`
                      : "No conservative benefit estimate available yet."}
                  </p>
                  <p className="muted">
                    This is the scenario that looks strongest even after you discount the estimate by the current uncertainty band.
                  </p>
                </div>
                {bestAffordableParetoPoint ? (
                  <div className="panel-card nested-card premium-scenario-card scenario-comparison-card">
                    <div className="scenario-comparison-head">
                      <strong>Best value per dollar</strong>
                      <span>{(scenarioValuePerDollar(bestAffordableParetoPoint) * 100000).toFixed(2)}°C eq. / $100k</span>
                    </div>
                    <h3>{bestAffordableParetoPoint.scenario.label}</h3>
                    <p className="scenario-comparison-note">
                      This favors the most modeled benefit for every $100,000 spent, which is a cleaner affordability lens than cost alone.
                    </p>
                    <p className="muted">
                      {bestAffordableParetoPoint.frontier ? "On the frontier" : "Dominated but visible"} · {bestAffordableParetoPoint.scenario.evidenceSummary.readinessLabel}
                    </p>
                  </div>
                ) : null}
              </div>
          ) : (
              <p className="muted">Create at least one scenario to unlock comparison.</p>
            )}
          </article>

          <article className="panel-card nested-card premium-scenario-card">
            <h2>Scenario recommendations</h2>
            <p className="muted">Each scenario returns a ranked action list, which keeps the recommendation story strong without pretending the budget allocation is fully validated.</p>
            <div className="panel-grid two-col">
              {filteredScenarios.map((scenario) => (
                <div key={scenario.id} className="panel-card nested-card premium-scenario-card premium-scenario-stack">
                  <div className="eyebrow">{scenario.cityId}</div>
                  <h3>{scenario.label}</h3>
                  <p className="muted">Planning mode: {planningModeLabel(scenario.planningMode)}</p>
                  <p>{scenario.summary}</p>
                  <p className="muted">Evidence readiness: {scenario.evidenceSummary.readinessLabel}</p>
                  <div className={`truth-badge ${scenario.evidenceSummary.verifiedUnitCostCount > 0 ? "observed" : scenario.evidenceSummary.benchmarkOnlyCount > 0 ? "estimated" : "derived"}`}>
                    {scenario.evidenceSummary.readinessLabel}
                  </div>
                  <p className="muted">{scenario.evidenceSummary.explanation}</p>
                  <p className="muted">
                    Verified unit-cost actions: {scenario.evidenceSummary.verifiedUnitCostCount} | Ranking-only actions: {scenario.evidenceSummary.rankingOnlyCount} | Benchmark-only actions: {scenario.evidenceSummary.benchmarkOnlyCount}
                  </p>
                  <p className="muted">Benchmark status: {scenario.benchmarkSummary.benchmarkLabel}</p>
                  <p className="muted">{scenario.benchmarkSummary.explanation}</p>
                  <p className="muted">
                    {scenario.benchmarkSummary.wholeCityBenchmarkUsd == null
                      ? "No whole-city benchmark is attached to this scenario."
                      : `Whole-city benchmark anchor: $${scenario.benchmarkSummary.wholeCityBenchmarkUsd.toLocaleString()}`}
                  </p>
                  <p className="muted">
                    {scenario.benchmarkSummary.budgetGapUsd == null
                      ? "No benchmark budget gap is available."
                      : `Remaining gap to benchmark package: $${scenario.benchmarkSummary.budgetGapUsd.toLocaleString()}`}
                  </p>
                  <p className="muted">
                    {scenario.exhaustiveEstimateSummary.available
                      ? `Verified exhaustive estimate: $${scenario.exhaustiveEstimateSummary.estimatedCostUsd?.toLocaleString() ?? "0"} across ${scenario.exhaustiveEstimateSummary.costableActions} costable action type(s).`
                      : "Verified exhaustive estimate not available yet."}
                  </p>
                  <p className="muted">
                    {scenario.exhaustiveEstimateSummary.available
                      ? `Remaining gap to verified exhaustive scope: $${scenario.exhaustiveEstimateSummary.remainingGapUsd?.toLocaleString() ?? "0"}.`
                      : scenario.exhaustiveEstimateSummary.methodology}
                  </p>
                  <p className="muted">
                    Allocated: ${scenario.allocationSummary.totalAllocatedBudgetUsd.toLocaleString()} of ${scenario.budgetUsd.toLocaleString()} ({Math.round(scenario.allocationSummary.allocationCoveragePct * 100)}% coverage)
                  </p>
                  <p className="muted">
                    Unallocated benchmark budget: ${scenario.allocationSummary.unallocatedBudgetUsd.toLocaleString()}
                  </p>
                  <p className="muted">{scenario.allocationSummary.allocationMethod}</p>
                  <p className="muted">
                    Source trail:{" "}
                    {scenario.evidenceSummary.verifiedUnitCostCount > 0
                      ? "mixed verified unit-cost rows and comparative evidence"
                      : scenario.evidenceSummary.benchmarkOnlyCount > 0
                        ? "benchmark-only planning anchor"
                        : "comparative ranking sources"}
                  </p>
                  <p className="muted">
                    {scenario.recommendedActions.length === 0
                      ? "No structured action list is attached to this scenario."
                      : `${scenario.recommendedActions.length} ranked action recommendations are attached to this scenario.`}
                  </p>
                  {(() => {
                    const heatProof = heatProofByScenario.get(scenario.id);
                    if (!heatProof) {
                      return null;
                    }
                    return (
                      <div className="scenario-heat-proof">
                        <div className="scenario-heat-proof-head">
                          <div>
                            <div className="eyebrow">Evidence-weighted heat proof</div>
                            <h4>{`${heatProof.totalImpactC.toFixed(2)}°C eq.`}</h4>
                            <p className="muted">
                              Conservative band: {`${heatProof.lowerImpactC.toFixed(2)}°C eq.`} to {`${heatProof.upperImpactC.toFixed(2)}°C eq.`}
                            </p>
                          </div>
                          <div className="truth-badge derived">Scenario proxy</div>
                        </div>
                        <div className="scenario-heat-proof-strip">
                          <div className="scenario-heat-proof-pill">
                            <span>Structural gain</span>
                            <strong>{heatProof.structuralGain.toFixed(3)}</strong>
                          </div>
                          <div className="scenario-heat-proof-pill">
                            <span>Evidence mix</span>
                            <strong>{`${scenario.evidenceSummary.verifiedUnitCostCount}/${scenario.evidenceSummary.rankingOnlyCount}/${scenario.evidenceSummary.benchmarkOnlyCount}`}</strong>
                          </div>
                          <div className="scenario-heat-proof-pill">
                            <span>Conservative drop</span>
                            <strong>{`${heatProof.lowerImpactC.toFixed(2)}°C to ${heatProof.upperImpactC.toFixed(2)}°C`}</strong>
                          </div>
                        </div>
                        <p className="scenario-heat-proof-story">
                          {scenario.evidenceSummary.verifiedUnitCostCount > 0
                            ? "This scenario is strongest when verified unit-cost actions are paired with high-priority interventions that improve the city graph structure and reliability."
                            : "This scenario is strongest as a comparative planning signal: the math ranks leverage clearly, but the uncertainty stays wider because the evidence base is less directly measured."}
                        </p>
                        <MathBlock tex={heatProof.formula} className="scenario-proof-formula scenario-heat-proof-formula" />
                        <MathBlock tex={`R = ${heatProof.structuralGain.toFixed(3)}`} className="scenario-proof-formula scenario-heat-proof-formula scenario-heat-proof-r-formula" />
                        <p className="muted">
                          The structural gain comes from λ2, reliability, and percolation improvements. This is the strongest available scenario-level estimate in the current model.
                        </p>
                        <div className="scenario-heat-proof-list">
                          {heatProof.contributions.map((contribution) => (
                            <div key={contribution.interventionId} className="scenario-heat-proof-row">
                              <div className="scenario-heat-proof-copy">
                                <strong>{contribution.name}</strong>
                                <MathBlock tex={contribution.formula} className="scenario-heat-proof-mini-formula" />
                              </div>
                              <div className="scenario-heat-proof-value">
                                <strong>{`${contribution.contributionC.toFixed(2)}°C eq.`}</strong>
                                <span>{`${(contribution.contributionC * (1 - heatProof.uncertainty)).toFixed(2)}°C to ${(contribution.contributionC * (1 + heatProof.uncertainty)).toFixed(2)}°C`}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="muted">
                          The uncertainty band widens when the scenario relies more on ranking-only or benchmark-only evidence and tightens when the plan is more grounded in verified unit-cost rows.
                        </p>
                        <p className="muted">{heatProof.note}</p>
                      </div>
                    );
                  })()}
                  <div className="quick-links">
                    <button
                      className="button-link secondary"
                      type="button"
                      onClick={() => queueRunMutation.mutate({ nextCityId: scenario.cityId, scenarioLabel: scenario.label })}
                      disabled={queueRunMutation.isPending}
                    >
                      {queueRunMutation.isPending ? "Queuing run..." : "Queue run from scenario"}
                    </button>
                  </div>
                  {scenario.recommendedActions.map((action) => (
                    <div key={`${scenario.id}-${action.interventionId}`} className="panel-card nested-card premium-scenario-action-card">
                      <div className="eyebrow">{action.category}</div>
                      <strong>{action.name}</strong>
                      <div className={`truth-badge ${evidenceTone(action.costStatus)}`}>
                        {evidenceLabel(action.costStatus)}
                      </div>
                      <p className="muted">
                        {action.priorityRank == null ? "No priority rank assigned." : `Priority rank: ${action.priorityRank}`}
                      </p>
                      <p className="muted">
                        {actionCostLabel(action)}
                      </p>
                      <p className="muted">{action.allocationBasis}</p>
                      <p className="muted">
                        Source trail:{" "}
                        {action.costStatus === "verified_unit_cost"
                          ? "verified unit-cost seed row plus public cost anchor"
                          : action.costStatus === "benchmark_only"
                            ? "whole-city benchmark source anchor"
                            : "comparative ranking source anchor"}
                      </p>
                      <p className="muted">{action.rationale}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {filteredScenarios.length === 0 ? (
              <p className="muted">No scenarios meet the current mode evidence thresholds yet. Lower thresholds by switching mode or generate additional evidence-backed scenarios.</p>
            ) : null}
          </article>

          {activeScenarioHierarchy ? (
            <article className="panel-card nested-card premium-scenario-card scenario-hierarchy-card">
              <div className="scenario-hierarchy-head">
                <div>
                  <div className="eyebrow">Scenario hierarchy</div>
                  <h2>{activeSunburstScenario?.label ?? "Active scenario"}</h2>
                  <p className="muted">
                    This second hierarchy view keeps the active scenario legible by breaking it into evidence, budget, and modeled benefit layers.
                  </p>
                </div>
                <div className="truth-badge derived">Decision ladder</div>
              </div>
              <div className="scenario-hierarchy-grid">
                <div className="scenario-hierarchy-stack">
                  <strong>Evidence</strong>
                  {activeScenarioHierarchy.evidence.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="scenario-hierarchy-stack">
                  <strong>Budget</strong>
                  {activeScenarioHierarchy.budget.map((item) => <span key={item}>{item}</span>)}
                </div>
                <div className="scenario-hierarchy-stack">
                  <strong>Benefit</strong>
                  {activeScenarioHierarchy.benefit.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            </article>
          ) : null}

          <article className="panel-card nested-card premium-scenario-card">
            <h2>Verified cost sources</h2>
            <p className="muted">These are real references loaded from the repository, not synthetic placeholders.</p>
            <div className="panel-grid two-col">
              {(costSourcesQuery.data ?? []).map((source: CostSource) => (
                <div key={source.id} className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">{source.category}</div>
                  <h3>{source.name}</h3>
                  <div className={`truth-badge ${source.estimatedCostUsd == null ? "derived" : "observed"}`}>
                    {source.estimatedCostUsd == null ? "Context source" : "Cost anchor"}
                  </div>
                  <p>{source.summary}</p>
                  <p className="muted">
                    {source.estimatedCostUsd == null ? "Cost figure not expressed as a unit price." : `Estimated cost anchor: $${source.estimatedCostUsd.toLocaleString()}`}
                  </p>
                  <p className="muted">{source.sourceNote}</p>
                  <a href={source.evidenceUrl} target="_blank" rel="noreferrer">Open evidence</a>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card nested-card premium-scenario-card">
            <h2>Intervention catalog</h2>
            <p className="muted">This catalog turns the real sources into explicit planning actions and shows where evidence is still ranking-only.</p>
            <div className="panel-grid two-col">
              {(interventionsQuery.data ?? []).map((intervention: InterventionRecord) => (
                <div key={intervention.id} className="panel-card nested-card premium-scenario-card">
                  <div className="eyebrow">{intervention.category}</div>
                  <h3>{intervention.name}</h3>
                  <div className={`truth-badge ${evidenceTone(intervention.costStatus)}`}>
                    {evidenceLabel(intervention.costStatus)}
                  </div>
                  <p>{intervention.summary}</p>
                  <p className="muted">
                    {intervention.priorityRank == null ? "No comparative rank assigned." : `Priority rank: ${intervention.priorityRank}`}
                  </p>
                  <p className="muted">
                    {intervention.unitCostUsd == null
                      ? `Cost status: ${intervention.costStatus.replaceAll("_", " ")}`
                      : `Unit-cost anchor: $${intervention.unitCostUsd.toLocaleString()} per ${intervention.measurementUnit}`}
                  </p>
                  <p className="muted">{intervention.sourceNote}</p>
                  <a href={intervention.evidenceUrl} target="_blank" rel="noreferrer">Open evidence</a>
                </div>
              ))}
            </div>
          </article>
        </div>
      </details>
    </section>
  );
}
