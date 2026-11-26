import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { interventionId: string; fallback?: string };

/** Small, consistent illustrations for the interventions in the learning grid. */
export function InterventionIcon({ interventionId, fallback, ...props }: Props) {
  const common = { viewBox: "0 0 48 48", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const, ...props };
  const illustration = (() => {
    switch (interventionId) {
      case "tree-canopy": return <><path d="M24 39V23M17 39h14" /><path d="M13 27a9 9 0 0 1-2-17 10 10 0 0 1 18-1 9 9 0 0 1 6 17H13Z" fill="currentColor" fillOpacity=".17" /><path d="M18 30c2 2 4 3 6 3s4-1 6-3" /></>;
      case "shade-structure": return <><path d="M6 20 24 9l18 11H6Z" fill="currentColor" fillOpacity=".17" /><path d="M10 21v18m28-18v18M7 39h34M18 26h12" /></>;
      case "cool-surface": return <><path d="m6 29 29-8 7 8-29 8-7-8Z" fill="currentColor" fillOpacity=".17" /><path d="M14 13v8m-4-4h8M29 8v8m-4-4h8" /></>;
      case "cool-roof": return <><path d="m5 23 19-12 19 12M10 23v17h28V23M15 20h18" /><path d="m18 27 12-4-2 10-12 4 2-10Z" fill="currentColor" fillOpacity=".17" /></>;
      case "cool-pavement": return <><path d="M6 13h36M6 35h36M12 13l-6 22m30-22 6 22M18 23h5m3 0h4m-11 7h4m3 0h3" /><path d="M7 17h34v14H7z" fill="currentColor" fillOpacity=".1" stroke="none" /></>;
      case "permeable-paving": return <><path d="M6 19h36M6 31h36M17 19v12m14-12v12" /><path d="M11 11c0 2-2 4-2 5a2 2 0 0 0 4 0c0-1-2-3-2-5Zm26 23c0 2-2 4-2 5a2 2 0 0 0 4 0c0-1-2-3-2-5Z" fill="currentColor" fillOpacity=".2" /></>;
      case "cooling-access-node": return <><path d="M9 40V16l15-8 15 8v24H9ZM16 40V28h16v12M19 17h10m-5-5v10" /><path d="m5 26-2 2 2 2m38-4 2 2-2 2" /></>;
      default: return <text x="24" y="33" textAnchor="middle" fill="currentColor" stroke="none" fontSize="28">{fallback ?? "•"}</text>;
    }
  })();
  return <svg {...common}>{illustration}</svg>;
}
