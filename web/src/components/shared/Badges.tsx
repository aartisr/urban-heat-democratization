/**
 * Reusable badge components for displaying metrics and scores
 * Extracted from repeated patterns across the application
 */

import React from "react";
import { formatScore, formatWithUnit, scoreToLabel } from "../../lib/formatting";

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}

/**
 * Generic badge component
 */
export function Badge({ variant = "primary", size = "md", className = "", children }: BadgeProps) {
  const baseClass = "inline-flex items-center justify-center rounded-full font-semibold";
  const sizeClass = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  }[size];

  const variantClass = {
    primary: "bg-blue-100 text-blue-900",
    secondary: "bg-purple-100 text-purple-900",
    success: "bg-emerald-100 text-emerald-900",
    warning: "bg-amber-100 text-amber-900",
    danger: "bg-red-100 text-red-900",
    muted: "bg-slate-100 text-slate-700",
  }[variant];

  return <span className={`${baseClass} ${sizeClass} ${variantClass} ${className}`}>{children}</span>;
}

interface ScoreBadgeProps {
  score: unknown;
  maxScore?: number;
  showLabel?: boolean;
  className?: string;
  showMax?: boolean;
}

/**
 * Score display badge - handles null/undefined safely
 */
export function ScoreBadge({ score, maxScore = 10, showLabel = true, className = "", showMax = false }: ScoreBadgeProps) {
  const label = scoreToLabel(score);
  const variantMap: Record<string, BadgeVariant> = {
    High: "success",
    Medium: "warning",
    Low: "danger",
    Unknown: "muted",
  };

  const displayValue = formatScore(score, maxScore);
  const shortValue = formatWithUnit(score, 1, showMax ? ` / ${maxScore}` : "");

  return (
    <Badge variant={variantMap[label]} size="md" className={className}>
      <span className="font-mono font-bold" title={`Score: ${displayValue}`}>{shortValue}</span>
      {showLabel && <span className="ml-1 text-xs opacity-75">{label}</span>}
    </Badge>
  );
}

interface MetricBadgeProps {
  value: unknown;
  unit?: string;
  label?: string;
  digits?: number;
  className?: string;
}

/**
 * Metric display badge (temperature, percentage, etc.)
 */
export function MetricBadge({ value, unit = "", label, digits = 1, className = "" }: MetricBadgeProps) {
  return (
    <div className={`badge-container ${className}`}>
      <strong className="font-mono">{formatWithUnit(value, digits, unit)}</strong>
      {label && <p className="text-xs text-slate-500 mt-1">{label}</p>}
    </div>
  );
}

interface PropertyRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  mono?: boolean;
}

/**
 * Property row for displaying key-value pairs
 */
export function PropertyRow({ label, value, className = "", mono = false }: PropertyRowProps) {
  return (
    <div className={`flex justify-between py-2 px-3 border-b border-slate-200 ${className}`}>
      <span className="text-slate-600">{label}</span>
      <strong className={mono ? "font-mono" : ""}>{value}</strong>
    </div>
  );
}

interface PropertyListProps {
  properties: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
  maxItems?: number;
}

/**
 * Property list component
 */
export function PropertyList({ properties, className = "", maxItems }: PropertyListProps) {
  const items = maxItems ? properties.slice(0, maxItems) : properties;

  return (
    <div className={`property-list border-t border-slate-200 ${className}`}>
      {items.map((prop, idx) => (
        <PropertyRow key={idx} label={prop.label} value={prop.value} />
      ))}
    </div>
  );
}

interface CollapsiblePanelProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
  onToggle?: (open: boolean) => void;
}

/**
 * Collapsible panel component
 */
export function CollapsiblePanel({ title, defaultOpen = false, className = "", children, onToggle }: CollapsiblePanelProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  const handleToggle = () => {
    const newState = !open;
    setOpen(newState);
    onToggle?.(newState);
  };

  return (
    <details className={`panel ${className}`} open={open} onToggle={handleToggle}>
      <summary className="cursor-pointer select-none font-semibold text-slate-700 hover:text-slate-900 py-2 px-3 border-b border-slate-200">
        <span className="inline-block mr-2">{open ? "−" : "↓"}</span>
        {title}
      </summary>
      <div className="p-3">{children}</div>
    </details>
  );
}
