export const journeySteps = [
  { id: "choose", number: 1, title: "Choose your path", detail: "Pick what you want to learn or decide.", to: "/modes" },
  { id: "explore", number: 2, title: "Explore a city", detail: "See heat evidence and its limits.", to: "/cities" },
  { id: "try", number: 3, title: "Try a cooling action", detail: "Place shade, trees, or surfaces.", to: "/mitigation-lab" },
  { id: "compare", number: 4, title: "Compare options", detail: "See what a budget might support.", to: "/scenarios" },
  { id: "share", number: 5, title: "Share findings", detail: "Take the evidence with you.", to: "/exports" },
] as const;

export type JourneyStepId = (typeof journeySteps)[number]["id"];

export function journeyStepForPath(pathname: string): JourneyStepId | null {
  if (pathname === "/modes") return "choose";
  if (pathname === "/cities" || pathname.startsWith("/cities/")) return "explore";
  if (pathname === "/mitigation-lab" || pathname === "/address-plan") return "try";
  if (pathname === "/scenarios") return "compare";
  if (pathname === "/exports") return "share";
  return null;
}

export function validJourneyVisits(value: unknown): JourneyStepId[] {
  if (!Array.isArray(value)) return [];
  const known = new Set<string>(journeySteps.map((step) => step.id));
  return [...new Set(value.filter((item): item is JourneyStepId => typeof item === "string" && known.has(item)))];
}

export function nextJourneyStep(pathname: string, visited: JourneyStepId[]) {
  const currentId = journeyStepForPath(pathname);
  const index = journeySteps.findIndex((step) => step.id === currentId);
  if (index >= 0) return journeySteps[index + 1] ?? null;
  return journeySteps.find((step) => !visited.includes(step.id)) ?? journeySteps[0];
}
