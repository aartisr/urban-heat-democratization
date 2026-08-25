export type AddressAdviceRole = "renter" | "owner" | "community" | "organization";
export type ApproximatePlaceMode = "label" | "study_area";

export type AddressAdviceInput = {
  placeLabel: string;
  cityId: string;
  placeMode: ApproximatePlaceMode;
  coarseAreaId: string;
  role: AddressAdviceRole;
};

export type ActionGroup = {
  eyebrow: string;
  title: string;
  description: string;
  actions: string[];
  sources: AddressAdviceSourceId[];
};

export type AddressAdviceSourceId = "cdc" | "uswds" | "epa";

export const addressAdviceSources: Record<AddressAdviceSourceId, { label: string; url: string; use: string }> = {
  cdc: {
    label: "CDC heat guidance",
    url: "https://www.cdc.gov/extreme-heat/prevention/index.html",
    use: "Basis for heat-safety information and links.",
  },
  uswds: {
    label: "USWDS address guidance",
    url: "https://designsystem.digital.gov/patterns/create-a-user-profile/address/",
    use: "Basis for clear location-input and privacy cues.",
  },
  epa: {
    label: "EPA EnviroAtlas data scale",
    url: "https://www.epa.gov/enviroatlas/about-data",
    use: "Basis for describing evidence scale and limits.",
  },
};

const roleCopy: Record<AddressAdviceRole, { label: string; siteActions: string[] }> = {
  renter: {
    label: "I rent",
    siteActions: [
      "Check what window shading or portable cooling options your lease permits.",
      "Ask the landlord about cooling maintenance, exterior shade, and building heat protections.",
      "If the issue affects neighbors, bring a specific question to a tenant group or local housing resource.",
    ],
  },
  owner: {
    label: "I own or manage a home",
    siteActions: [
      "Before planned roof work, ask a qualified professional about cool-roof, insulation, and air-sealing options.",
      "Protect healthy existing trees and investigate a feasible shade or planting site with utility, drainage, and maintenance checks.",
      "Check local incentives, permits, and contractor requirements before committing to a project.",
    ],
  },
  community: {
    label: "I work with neighbors",
    siteActions: [
      "Identify one route, stop, crossing, school path, or public space that needs a shade or cooling-access review.",
      "Invite people who use the place to name what the map may miss: access, safety, hours, shade, or maintenance.",
      "Ask a local steward for a bounded response such as a site visit, shade audit, or cooling-resource update.",
    ],
  },
  organization: {
    label: "I represent an organization",
    siteActions: [
      "Choose one public-interest location and name the decision this evidence could inform.",
      "Pair a site observation with a local data steward, an accountable decision owner, and community review.",
      "Propose a bounded pilot with before-and-after measures rather than a promised temperature outcome.",
    ],
  },
};

export const addressAdviceRoles = (Object.entries(roleCopy) as Array<[AddressAdviceRole, typeof roleCopy[AddressAdviceRole]]>)
  .map(([value, entry]) => ({ value, label: entry.label }));

export const addressAdviceStudyCities = [
  {
    id: "boston",
    label: "Boston, MA · bundled study city",
    coarseAreas: [
      { id: "north", label: "Northern study area" },
      { id: "central", label: "Central study area" },
      { id: "south", label: "Southern study area" },
      { id: "east", label: "Eastern study area" },
      { id: "west", label: "Western study area" },
    ],
  },
];

const streetAddressPattern = /^\s*\d{1,6}\s+.+\b(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|place|pl|way)\.?\s*$/i;

export function approximatePlaceError(value: string): string | null {
  if (streetAddressPattern.test(value)) {
    return "Use a neighborhood, ZIP code, intersection, or rough study area—not a street address.";
  }
  return null;
}

export function buildAddressAdvicePlan(input: AddressAdviceInput): ActionGroup[] {
  const site = roleCopy[input.role];
  return [
    {
      eyebrow: "During heat",
      title: "Stay safe first",
      description: "Use official heat and local public-health guidance for today’s conditions.",
      actions: [
        "Find air-conditioned space, drink water regularly, and plan shade and rest breaks.",
        "Check on neighbors, friends, and family who may need support.",
        "Use local emergency services for urgent symptoms or a heat emergency.",
      ],
      sources: ["cdc"],
    },
    {
      eyebrow: "For your role",
      title: "Investigate what you can influence",
      description: `These are questions to explore as someone who says: “${site.label}.”`,
      actions: site.siteActions,
      sources: ["epa"],
    },
    {
      eyebrow: "For the block",
      title: "Turn a concern into shared evidence",
      description: "A map can point to a question; local observation helps test it.",
      actions: [
        "Record a non-identifying observation: date, time, public location, and what you noticed.",
        "Choose one claim to verify, such as a shade gap, a hot waiting area, or an inaccessible cooling resource.",
        "Bring the observation to a relevant local steward and request one bounded next step.",
      ],
      sources: ["epa"],
    },
  ];
}

export function displayPlace(input: AddressAdviceInput): string {
  const label = input.placeLabel.trim();
  if (input.placeMode === "study_area") {
    const city = addressAdviceStudyCities.find((entry) => entry.id === input.cityId);
    return city?.coarseAreas.find((area) => area.id === input.coarseAreaId)?.label ?? "your selected study area";
  }
  return label || "your selected area";
}

export const phaseTwoComprehensionChecks = [
  "The page states that a street address is not accepted in this phase.",
  "The page states that the place label stays in the browser and is not sent to the evidence service.",
  "The evidence card labels its scale and states that no spectral result is shown.",
] as const;

export const addressAdviceLimits = [
  "This tool does not measure indoor temperature or personal heat risk.",
  "It does not inspect a parcel, certify a property, or guarantee the impact of an action.",
  "A spectral result is shown only when supported neighborhood-scale data and its documented quality checks are available.",
];
