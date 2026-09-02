import { DimensionScore, PlatformBenchmark, PersonaProfile, SWOTItem, MitigationScenario } from '../types';

export const TARGET_METADATA = {
  url: "https://urban-heat.ai-aarti.com",
  platformName: "Urban Heat Democratization",
  creator: "Aarti S Ravikumar",
  organization: "ai-aarti.com",
  canonicalRepo: "github.com/aartisr/urban-heat-democratization",
  overallScore: 8.9,
  ratingGrade: "A+ / Exceptional (8.9 / 10)",
  verdictTitle: "Exemplary Open-Science Civic Climate Tech",
  primaryFocus: "Democratizing urban heat island data, cooling equity disparities, and transparent neighborhood mitigation scenarios",
  targetAudience: "Community Advocates, Urban Planners, Climate Researchers, Educators, and Civic Leaders",
  evaluationDate: "September 2026",
  status: "Active Public Research Platform"
};

export const DIMENSIONS: DimensionScore[] = [
  {
    id: "mission_equity",
    category: "Mission & Social Impact",
    title: "Thermal Equity & Civic Democratization",
    score: 9.4,
    weight: 0.20,
    icon: "HeartHandshake",
    summary: "Superb alignment with environmental justice principles. Translates opaque microclimate data into actionable equity metrics for heat-vulnerable communities.",
    strengths: [
      "Explicit focus on cooling disparity across socio-economically marginalized neighborhoods",
      "Bridges the gap between academic remote sensing and grass-roots neighborhood activism",
      "Prioritizes 'local wisdom' alongside quantitative satellite observations"
    ],
    growthAreas: [
      "Could incorporate multi-lingual accessibility (Spanish, Cantonese, Haitian Creole) for broader community reach in diverse cities"
    ],
    recommendation: "Introduce localized language toggles and community story submission portals to further amplify community voices.",
    subCriteria: [
      {
        id: "equity_focus",
        name: "Environmental Justice & Equity Centering",
        score: 9.6,
        maxScore: 10,
        weight: 0.4,
        commentary: "Highlights structural inequalities in tree canopy distribution and thermal burden with high ethical clarity.",
        verdict: "exceptional"
      },
      {
        id: "accessibility_intent",
        name: "Democratization of Complex Climate Science",
        score: 9.3,
        maxScore: 10,
        weight: 0.35,
        commentary: "Demystifies radiometric temperature versus ambient heat index for everyday residents.",
        verdict: "exceptional"
      },
      {
        id: "civic_relevance",
        name: "Relevance to Municipal Policy Decisions",
        score: 9.2,
        maxScore: 10,
        weight: 0.25,
        commentary: "Provides concrete data points directly applicable to city master planning and cooling center allocation.",
        verdict: "exceptional"
      }
    ]
  },
  {
    id: "scientific_rigor",
    category: "Data & Scientific Rigor",
    title: "Thermal Modeling & Evidence Quality",
    score: 9.1,
    weight: 0.20,
    icon: "Database",
    summary: "Solid scientific foundation using satellite thermal infrared (Landsat/ECOSTRESS) combined with urban morphology and land-use datasets.",
    strengths: [
      "Distinguishes clearly between Land Surface Temperature (LST) and ambient 2-meter air temperature",
      "Explicitly documents data limitations, satellite overpass times, and cloud-cover filtering",
      "Incorporates canopy density and impervious surface ratio correlations"
    ],
    growthAreas: [
      "Integration of real-time or hyper-local IoT ground sensor networks (e.g. PurpleAir/heat logger networks) would complement orbital passes"
    ],
    recommendation: "Provide downloadable confidence intervals and metadata provenance cards for every geographic boundary layer.",
    subCriteria: [
      {
        id: "sensor_accuracy",
        name: "Remote Sensing & Thermal Methodology",
        score: 9.2,
        maxScore: 10,
        weight: 0.35,
        commentary: "Sound atmospheric correction and surface emissivity parameterization based on established peer-reviewed literature.",
        verdict: "exceptional"
      },
      {
        id: "uncertainty_bounds",
        name: "Transparency of Scientific Limitations",
        score: 9.3,
        maxScore: 10,
        weight: 0.35,
        commentary: "Refuses to overclaim precision; clearly states diurnal temperature variations and spatial resolution boundaries.",
        verdict: "exceptional"
      },
      {
        id: "multi_scale_analysis",
        name: "Spatial Granularity (Census Tract to Parcel)",
        score: 8.8,
        maxScore: 10,
        weight: 0.30,
        commentary: "Excellent neighborhood-level aggregation, with opportunity to drill down to 10m micro-corridors.",
        verdict: "strong"
      }
    ]
  },
  {
    id: "interactive_lab",
    category: "Interactive Simulation",
    title: "Scenario Lab & Mitigation Modeling",
    score: 8.8,
    weight: 0.20,
    icon: "SlidersHorizontal",
    summary: "Engaging interactive scenario sandbox allowing users to model interventions (albedo roofs, tree canopy expansion, shade structures).",
    strengths: [
      "Dynamic response parameters showing estimated temperature delta (°C/°F) under different intervention intensities",
      "Multi-variable simulation balancing green infrastructure, reflective surfaces, and built shade",
      "Instant visual feedback illustrating how cooling benefits distribute across neighborhoods"
    ],
    growthAreas: [
      "Economic costing estimates (e.g., estimated CAPEX/OPEX per square kilometer of cool pavement or mature oak canopy) could be expanded"
    ],
    recommendation: "Add financial cost-benefit modeling and tree maturity timeline sliders (Year 1 vs Year 10 canopy growth).",
    subCriteria: [
      {
        id: "simulation_responsiveness",
        name: "Dynamic Parameter Control & UI Interactivity",
        score: 9.0,
        maxScore: 10,
        weight: 0.40,
        commentary: "Fluid controls that allow non-technical users to explore trade-offs between mitigation strategies.",
        verdict: "exceptional"
      },
      {
        id: "ecological_validity",
        name: "Ecological Realism of Cooling Deltas",
        score: 8.7,
        maxScore: 10,
        weight: 0.35,
        commentary: "Cooling estimates reflect realistic thermodynamic limits without promising impossible microclimate miracles.",
        verdict: "strong"
      },
      {
        id: "exportability",
        name: "Scenario Saving & Policy Export",
        score: 8.6,
        maxScore: 10,
        weight: 0.25,
        commentary: "Good summary views; adding 1-click PDF executive brief exports for city council meetings would make it a 10.",
        verdict: "strong"
      }
    ]
  },
  {
    id: "ux_design",
    category: "UX, Visuals & Usability",
    title: "Information Architecture & Craft",
    score: 8.5,
    weight: 0.15,
    icon: "LayoutTemplate",
    summary: "Thoughtful, dignified layout with warm neutral tones and legible typography. Resists generic dashboard clutter in favor of narrative clarity.",
    strengths: [
      "High visual restraint: no distracting gimmicks, focusing user attention on evidence and maps",
      "Clear visual hierarchy guiding the reader from problem context to case studies and interactive labs",
      "Accessible color maps (avoiding rainbow jet colormaps that distort perception for colorblind users)"
    ],
    growthAreas: [
      "Mobile responsive touch targets on map layers could benefit from minor touch optimization",
      "Could add guided onboarding tooltips for first-time community users"
    ],
    recommendation: "Implement an interactive 'Tour this Platform' onboarding flow and enhance mobile drawer controls.",
    subCriteria: [
      {
        id: "typography_hierarchy",
        name: "Typography, Spacing & Visual Rhythm",
        score: 8.8,
        maxScore: 10,
        weight: 0.35,
        commentary: "Elegant editorial cadence with comfortable line lengths and clean data cards.",
        verdict: "strong"
      },
      {
        id: "colormap_safety",
        name: "Color Accessibility & Palette Ergonomics",
        score: 9.0,
        maxScore: 10,
        weight: 0.35,
        commentary: "Uses perceptually uniform, colorblind-friendly thermal ramps (e.g. viridis / inferno / magma derived scales).",
        verdict: "exceptional"
      },
      {
        id: "mobile_adaptive",
        name: "Mobile Device Performance & Touch Layout",
        score: 7.8,
        maxScore: 10,
        weight: 0.30,
        commentary: "Functional on handheld devices; map inspection feels optimized primarily for medium-to-large desktop displays.",
        verdict: "adequate"
      }
    ]
  },
  {
    id: "open_science",
    category: "Open Science & Trust",
    title: "Reproducibility & Open Source Ethos",
    score: 9.2,
    weight: 0.15,
    icon: "ShieldCheck",
    summary: "Benchmark-setting transparency. Open GitHub codebase, citation references, and commitment to public-interest software architecture.",
    strengths: [
      "Public GitHub repository allowing audit of data transformations and visualization pipelines",
      "No gated paywalls or commercial lock-in; public interest orientation",
      "Transparent attribution to author Aarti S Ravikumar and collaborating data sources"
    ],
    growthAreas: [
      "Adding a direct REST / GeoJSON API endpoint for programmatic GIS querying by external civic hackers"
    ],
    recommendation: "Publish an open API and downloadable GeoTIFF / Shapefile packages for municipal GIS teams.",
    subCriteria: [
      {
        id: "code_openness",
        name: "Open Source Codebase & Reproducibility",
        score: 9.5,
        maxScore: 10,
        weight: 0.40,
        commentary: "Exemplary GitHub release with clean documentation and reproducible analytical scripts.",
        verdict: "exceptional"
      },
      {
        id: "citation_rigor",
        name: "Academic Citation & Source Attribution",
        score: 9.2,
        maxScore: 10,
        weight: 0.35,
        commentary: "Thorough footnotes referencing peer-reviewed microclimatology and municipal data repositories.",
        verdict: "exceptional"
      },
      {
        id: "data_interoperability",
        name: "Data Interoperability & GIS Integration",
        score: 8.8,
        maxScore: 10,
        weight: 0.25,
        commentary: "Strong web data views; could offer standardized GeoJSON/OGC WMS endpoints.",
        verdict: "strong"
      }
    ]
  },
  {
    id: "actionability",
    category: "Actionability & Case Studies",
    title: "Case Studies & Policy Translation",
    score: 8.6,
    weight: 0.10,
    icon: "Target",
    summary: "Anchors abstract thermal mechanics into concrete municipal realities (e.g. Boston case study) with tangible intervention playbooks.",
    strengths: [
      "Grounds findings in real geographical context with tangible urban features (waterfronts, transit corridors)",
      "Highlights cooling access metrics (distance to shaded parks, splash pads, air-conditioned public libraries)",
      "Provides actionable talking points for neighborhood association hearings"
    ],
    growthAreas: [
      "Expand beyond current case study cities to create an automated pipeline for any North American or global city"
    ],
    recommendation: "Introduce a multi-city selector pipeline (e.g. Phoenix, Chicago, Atlanta, London, Mumbai) to expand global reach.",
    subCriteria: [
      {
        id: "case_depth",
        name: "Depth of City Case Studies (e.g. Boston)",
        score: 9.0,
        maxScore: 10,
        weight: 0.40,
        commentary: "Rich neighborhood analysis connecting redlining history with contemporary surface temperature hotspots.",
        verdict: "exceptional"
      },
      {
        id: "cooling_access",
        name: "Cooling Infrastructure Access Auditing",
        score: 8.7,
        maxScore: 10,
        weight: 0.35,
        commentary: "Evaluates not just heat exposure, but the social infrastructure required for safe respite.",
        verdict: "strong"
      },
      {
        id: "scalability",
        name: "Multi-City Geographic Scalability",
        score: 8.0,
        maxScore: 10,
        weight: 0.25,
        commentary: "Currently focused on featured flagship studies; immense potential to scale modularly.",
        verdict: "strong"
      }
    ]
  }
];

export const BENCHMARKS: PlatformBenchmark[] = [
  {
    name: "urban-heat.ai-aarti.com (Aarti S Ravikumar)",
    url: "https://urban-heat.ai-aarti.com",
    focus: "Open Democratization, Cooling Equity, Scenario Interactivity",
    openScienceScore: 9.2,
    uxSimplicityScore: 8.8,
    localActionScore: 8.6,
    equityFocusScore: 9.5,
    overallScore: 8.9,
    comparisonNote: "Best-in-class blend of academic transparency, interactive simulation, and grassroots thermal equity narrative."
  },
  {
    name: "Trust for Public Land (TPL Heat Disparity)",
    url: "https://www.tpl.org",
    focus: "Park Equity, National US Urban Heat Severity",
    openScienceScore: 8.5,
    uxSimplicityScore: 8.6,
    localActionScore: 8.8,
    equityFocusScore: 9.2,
    overallScore: 8.7,
    comparisonNote: "Huge national coverage, but less transparent interactive sandbox modeling compared to Aarti's platform."
  },
  {
    name: "Climate Central (Urban Heat Hotspots)",
    url: "https://www.climatecentral.org",
    focus: "Journalistic Heat Index & Population Exposure",
    openScienceScore: 8.2,
    uxSimplicityScore: 9.0,
    localActionScore: 7.9,
    equityFocusScore: 8.4,
    overallScore: 8.3,
    comparisonNote: "Slick media visuals, but treats data more as broadcast journalism rather than an open participatory modeling lab."
  },
  {
    name: "NOAA Heat.gov / NIHHIS",
    url: "https://www.heat.gov",
    focus: "Federal Campaign Data, Community Heat Mapping",
    openScienceScore: 9.4,
    uxSimplicityScore: 7.4,
    localActionScore: 8.0,
    equityFocusScore: 8.2,
    overallScore: 8.1,
    comparisonNote: "Authoritative federal datasets, but complex enterprise GIS navigation that can overwhelm non-expert community advocates."
  },
  {
    name: "Google Environmental Insights Explorer (Tree Canopy)",
    url: "https://insights.sustainability.google",
    focus: "High-resolution AI aerial imagery for tree canopy",
    openScienceScore: 7.8,
    uxSimplicityScore: 8.7,
    localActionScore: 8.3,
    equityFocusScore: 8.1,
    overallScore: 8.2,
    comparisonNote: "State of the art imagery ML, but proprietary model pipelines with lower community governance."
  }
];

export const PERSONA_PROFILES: PersonaProfile[] = [
  {
    id: "balanced",
    title: "General Civic Tech Audit (Standard)",
    icon: "Scale",
    description: "Evenly weighted across scientific rigor, democratization, interactive UX, and policy value.",
    weights: {
      mission_equity: 0.20,
      scientific_rigor: 0.20,
      interactive_lab: 0.20,
      ux_design: 0.15,
      open_science: 0.15,
      actionability: 0.10
    }
  },
  {
    id: "community_advocate",
    title: "Community Organizer & Climate Justice Advocate",
    icon: "Users",
    description: "Prioritizes equity clarity, accessible language, and actionable neighborhood talking points.",
    weights: {
      mission_equity: 0.35,
      scientific_rigor: 0.10,
      interactive_lab: 0.20,
      ux_design: 0.20,
      open_science: 0.05,
      actionability: 0.10
    }
  },
  {
    id: "urban_planner",
    title: "Municipal Urban Planner & Resilience Officer",
    icon: "Building2",
    description: "Focuses heavily on scenario modeling, intervention ROI, and policy translation.",
    weights: {
      mission_equity: 0.15,
      scientific_rigor: 0.25,
      interactive_lab: 0.30,
      ux_design: 0.10,
      open_science: 0.10,
      actionability: 0.10
    }
  },
  {
    id: "academic_researcher",
    title: "Atmospheric & Geospatial Researcher",
    icon: "GraduationCap",
    description: "Emphasizes remote sensing methodology, open data reproducibility, and uncertainty bounds.",
    weights: {
      mission_equity: 0.10,
      scientific_rigor: 0.40,
      interactive_lab: 0.15,
      ux_design: 0.05,
      open_science: 0.25,
      actionability: 0.05
    }
  }
];

export const SWOT_DATA: SWOTItem[] = [
  {
    id: "s1",
    category: "strength",
    title: "Grassroots Thermal Equity Narrative",
    detail: "Directly centers vulnerable communities often ignored in standard technocratic GIS tools.",
    impact: "Critical"
  },
  {
    id: "s2",
    category: "strength",
    title: "Transparent Interactive Modeling Lab",
    detail: "Demystifies how tree canopies, cool pavements, and shade structures mathematically lower surface temperatures.",
    impact: "High"
  },
  {
    id: "s3",
    category: "strength",
    title: "Open Science & Ethical AI Foundations",
    detail: "Committed to open public evidence, reproducible workflows, and honest boundary documentation.",
    impact: "Critical"
  },
  {
    id: "w1",
    category: "weakness",
    title: "Geographic Scope Footprint",
    detail: "Currently spotlighting specific urban case studies (e.g. Boston); needs broader self-serve city onboarding.",
    impact: "Medium"
  },
  {
    id: "w2",
    category: "weakness",
    title: "Automated Policy Report Generation",
    detail: "Lacks one-click automated PDF/Doc generator formatted for municipal grant and zoning filings.",
    impact: "Medium"
  },
  {
    id: "o1",
    category: "opportunity",
    title: "Crowdsourced Ground-Truth & IoT Ingestion",
    detail: "Allowing community members to upload personal microclimate sensor data (e.g. bicycle weather loggers).",
    impact: "High"
  },
  {
    id: "o2",
    category: "opportunity",
    title: "Multilingual Local Community Editions",
    detail: "Reaching frontline immigrant populations bearing the heaviest urban heat burdens in multiple languages.",
    impact: "High"
  },
  {
    id: "t1",
    category: "threat",
    title: "Data Maintenance & Satellite API Volatility",
    detail: "Ongoing maintenance of orbital thermal data streams (Landsat/ECOSTRESS) as cloud APIs shift.",
    impact: "Medium"
  }
];

export const SIMULATION_PRESETS: MitigationScenario[] = [
  {
    id: "baseline",
    name: "Current Baseline Neighborhood (Dense Asphalt)",
    canopyIncreasePct: 0,
    coolRoofAlbedoPct: 15,
    shadeStructuresSqM: 0,
    greenCorridorCount: 0,
    surfaceTempReductionC: 0,
    ambientTempReductionC: 0,
    coolingEquityImpact: 3.2,
    costEfficiency: "Baseline (Zero CapEx)",
    notes: "High thermal stress zone with 12°F excess heat over regional rural baseline."
  },
  {
    id: "tree_canopy_heavy",
    name: "Urban Forestry Initiative (+25% Mature Canopy)",
    canopyIncreasePct: 25,
    coolRoofAlbedoPct: 15,
    shadeStructuresSqM: 500,
    greenCorridorCount: 2,
    surfaceTempReductionC: 4.8,
    ambientTempReductionC: 2.1,
    coolingEquityImpact: 8.9,
    costEfficiency: "High Long-Term ROI (10-yr maturity)",
    notes: "Provides evapotranspiration cooling, stormwater retention, and mental health co-benefits."
  },
  {
    id: "cool_roofs_quick",
    name: "High-Albedo Roof & Pavement Retrofit (Cool Surface)",
    canopyIncreasePct: 5,
    coolRoofAlbedoPct: 65,
    shadeStructuresSqM: 1200,
    greenCorridorCount: 1,
    surfaceTempReductionC: 6.2,
    ambientTempReductionC: 1.6,
    coolingEquityImpact: 7.8,
    costEfficiency: "Fast Deployment (1-2 years)",
    notes: "Immediate solar reflectance jump from 0.15 to 0.70; significant peak cooling energy savings."
  },
  {
    id: "holistic_resilience",
    name: "Holistic Climate Equity Superblock (Aarti Model)",
    canopyIncreasePct: 30,
    coolRoofAlbedoPct: 60,
    shadeStructuresSqM: 2500,
    greenCorridorCount: 4,
    surfaceTempReductionC: 8.4,
    ambientTempReductionC: 3.6,
    coolingEquityImpact: 9.8,
    costEfficiency: "Max Community Benefit & Life-Safety",
    notes: "Transforms extreme heat hotspot into a resilient neighborhood thermal sanctuary."
  }
];
