export const journeySteps = [
  { id: "choose", number: 1, title: "Choose your path", detail: "Pick what you want to learn or decide.", to: "/modes" },
  { id: "explore", number: 2, title: "Explore a city", detail: "See heat evidence and its limits.", to: "/cities" },
  { id: "try", number: 3, title: "Try a cooling action", detail: "Place shade, trees, or surfaces.", to: "/mitigation-lab" },
  { id: "compare", number: 4, title: "Compare options", detail: "See what a budget might support.", to: "/scenarios" },
  { id: "share", number: 5, title: "Share findings", detail: "Take the evidence with you.", to: "/exports" },
] as const;

export type JourneyStepId = (typeof journeySteps)[number]["id"];

type InnovationMoment = { title: string; detail: string };

/** Explain the practical value at the point where a visitor can experience it. */
export function innovationMomentForPath(pathname: string, search: string = ""): InnovationMoment {
  if (pathname.startsWith("/cities/")) {
    const view = new URLSearchParams(search).get("view");
    if (view === "explore") return {
      title: "A map you can question",
      detail: "Select an area to see its modeled priority, source context, and limits together.",
    };
    if (view === "audit") return {
      title: "A result you can trace",
      detail: "Check the evidence, provenance, and caveats behind the city story.",
    };
    return {
      title: "A clear starting point",
      detail: "Begin with a plain-language answer, then open the layers that support it.",
    };
  }

  switch (pathname) {
    case "/modes": return {
      title: "A path shaped by your question",
      detail: "Choose your role and the app points you toward the evidence and tools most useful to you.",
    };
    case "/cities": return {
      title: "Evidence before the map",
      detail: "See which cities have real study data before exploring a result.",
    };
    case "/mitigation-lab": return {
      title: "See an idea on the ground",
      detail: "Place a cooling action and inspect its modeled reach on the learning grid.",
    };
    case "/address-plan": return {
      title: "Turn local knowledge into a plan",
      detail: "Record what a place needs alongside the evidence, so the map is a starting point for action.",
    };
    case "/scenarios": return {
      title: "Make tradeoffs visible",
      detail: "Compare what a budget might support while keeping assumptions and uncertainty in view.",
    };
    case "/exports": return {
      title: "Take the evidence with you",
      detail: "Share findings and source records that others can inspect beyond this app.",
    };
    default: return {
      title: "From evidence to action, in one path",
      detail: "Explore heat, test cooling ideas, compare choices, and carry the evidence into a conversation.",
    };
  }
}

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
