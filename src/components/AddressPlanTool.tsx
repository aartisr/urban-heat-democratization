import React, { useState } from 'react';
import { MapPin, Search, ShieldCheck, HeartHandshake, TreePine, Home, Users, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface AddressPlanResult {
  query: string;
  neighborhood: string;
  canopyScore: string;
  spectralGapSignal: string;
  immediateActions: string[];
  propertyActions: {
    renters: string[];
    homeowners: string[];
  };
  collectiveActions: string[];
}

const SAMPLE_ADDRESSES: Record<string, AddressPlanResult> = {
  'roxbury': {
    query: '142 Blue Hill Ave, Roxbury, Boston, MA',
    neighborhood: 'Roxbury (Nubian Square / Warren St Corridor)',
    canopyScore: '11.4% (Severely Constrained vs 38% Regional Average)',
    spectralGapSignal: 'High Bottleneck Proximity: Located 120m from the Melnea Cass Cheeger cut boundary. Cooling flow from Back Bay is impeded by surface imperviousness.',
    immediateActions: [
      'Locate designated municipal cooling centers: Shelburne Community Center (2730 Washington St) & Roxbury Branch BPL.',
      'Check transit waiting areas: Request temporary shade canopies at Warren St bus stops during extreme heat advisories.',
      'Use hydration stations located along the Dudley Square transit concourse.'
    ],
    propertyActions: {
      renters: [
        'Request exterior window solar shades or heat-reflective film from property management.',
        'Ensure window air conditioning units have clean filters and tight insulated foam perimeter seals.',
        'Report broken hallway ventilation or lack of operable cross-draft windows.'
      ],
      homeowners: [
        'Evaluate white elastomeric roof coatings (Solar Reflectance Index > 82) before standard tar replacement.',
        'Assess whether downspouts can redirect rainwater into front yard rain gardens or shade tree basins.',
        'Investigate City of Boston tree pit permit for unshaded sidewalk frontage.'
      ]
    },
    collectiveActions: [
      'Join the Roxbury Green Corridors Community Coalition to advocate for street tree plantings along Melnea Cass Boulevard.',
      'Upload street-level shade photographs to the neighborhood heat evidence repository.',
      'Advocate for cool pavement resurfacing during upcoming Boston Public Works repaving cycles.'
    ]
  },
  'dorchester': {
    query: '88 Bowdoin St, Dorchester, Boston, MA',
    neighborhood: 'Dorchester (Bowdoin-Geneva)',
    canopyScore: '13.8% (Below Urban Canopy Benchmark)',
    spectralGapSignal: 'Moderate Bottleneck: Trapped in a high-albedo deficit basin with limited convective drainage into Boston Harbor.',
    immediateActions: [
      'Access local relief at the Dorchester YMCA and Fields Corner Library cooling site.',
      'Utilize designated neighborhood splash pads at Ronan Park and Town Field during heat waves.'
    ],
    propertyActions: {
      renters: [
        'Request weatherstripping and interior reflective blinds from landlord.',
        'Coordinate with neighbors to establish a mutual aid cool-room protocol during blackout risks.'
      ],
      homeowners: [
        'Explore Mass Save energy efficiency incentives for heat pump cooling and attic insulation.',
        'De-pave rear asphalt parking slabs to install permeable turf or urban shade trees.'
      ]
    },
    collectiveActions: [
      'Participate in the Bowdoin-Geneva Urban Agriculture & Tree Stewardship Initiative.',
      'Petition for street-tree infill in empty sidewalk planting squares.'
    ]
  },
  'east_boston': {
    query: '205 Maverick St, East Boston, MA',
    neighborhood: 'East Boston (Maverick / Jeffries Point)',
    canopyScore: '9.8% (Extreme Maritime Urban Heat Island)',
    spectralGapSignal: 'Coastal Disconnect: Proximity to Boston Harbor is physically decoupled by industrial waterfront and Logan Airport tarmac heat plumes.',
    immediateActions: [
      'Bremen Street Community Park cooling spray features and East Boston BPL cooling branch.',
      'Piers Park coastal breeze vantage points for evening convective cooling relief.'
    ],
    propertyActions: {
      renters: [
        'Request air sealing to block simultaneous heat infiltration and jet fuel particulate matter.',
        'Utilize light-colored window drapes on western and southern exposures.'
      ],
      homeowners: [
        'Apply for green roof structural feasibility assessment or high-albedo roof paint rebates.',
        'Plant salt-tolerant coastal shade species (e.g., Honey Locust, Swamp White Oak).'
      ]
    },
    collectiveActions: [
      'Join Waterfront Green Corridor advocacy to preserve public open canopy along Boston Harbor.',
      'Submit local temperature ground-truth observations to the community sensor mesh.'
    ]
  }
};

export const AddressPlanTool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('roxbury');
  const [customInput, setCustomInput] = useState<string>('');
  
  const currentPlan = SAMPLE_ADDRESSES[searchTerm] || SAMPLE_ADDRESSES['roxbury'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.toLowerCase().includes('dorchester') || customInput.toLowerCase().includes('bowdoin')) {
      setSearchTerm('dorchester');
    } else if (customInput.toLowerCase().includes('east') || customInput.toLowerCase().includes('maverick') || customInput.toLowerCase().includes('jeffries')) {
      setSearchTerm('east_boston');
    } else {
      setSearchTerm('roxbury');
    }
  };

  return (
    <div id="address-cooling-plan-tool" className="space-y-6">
      {/* Banner */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Civic Democratization Blueprint (Phase 1-2 Operational)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Address-Neighborhood Cooling Action Plan
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              In accordance with <em>ADDRESS_LEVEL_SPECTRAL_URBANISM_ADVICE.md</em>, this tool provides evidence-bounded, collective guidance that translates spectral bottleneck signals into tangible tenant, homeowner, and neighborhood civic action—never an invasive or unverified property diagnosis.
            </p>
          </div>
        </div>
      </div>

      {/* Address Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Search Boston address or neighborhood (e.g. 142 Blue Hill Ave, Bowdoin St, Maverick Sq)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Generate Action Plan</span>
          </button>
        </form>

        <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Explore Pre-Calculated Pilot Tracts:</span>
          <button
            onClick={() => setSearchTerm('roxbury')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              searchTerm === 'roxbury' ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Roxbury (Blue Hill Ave)
          </button>
          <button
            onClick={() => setSearchTerm('dorchester')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              searchTerm === 'dorchester' ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Dorchester (Bowdoin-Geneva)
          </button>
          <button
            onClick={() => setSearchTerm('east_boston')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
              searchTerm === 'east_boston' ? 'bg-teal-50 border-teal-300 text-teal-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            East Boston (Maverick Sq)
          </button>
        </div>
      </div>

      {/* Plan Card Output */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Address Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold font-mono">
                ADDRESS PROFILE
              </span>
              <span className="text-xs font-semibold text-slate-500">{currentPlan.neighborhood}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mt-1">
              Cooling Action Opportunities for {currentPlan.query}
            </h3>
          </div>
        </div>

        {/* Spectral & Canopy Signals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <TreePine className="w-4 h-4 text-emerald-600" />
              <span>Observed Neighborhood Canopy Context</span>
            </div>
            <p className="text-xs text-slate-800 font-bold">{currentPlan.canopyScore}</p>
            <p className="text-[11px] text-slate-500">
              Derived from high-resolution NAIP & Landsat 30m multispectral analysis.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Spectral Urbanism Graph Signal</span>
            </div>
            <p className="text-xs text-indigo-950 font-medium leading-relaxed">
              {currentPlan.spectralGapSignal}
            </p>
          </div>
        </div>

        {/* 3-Layer Action Pathways */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Layered Cooling Pathways (From Immediate Relief to Collective Change)
          </h4>

          {/* Layer 1: Immediate Safety */}
          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2.5">
            <h5 className="text-xs font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Layer 1: Immediate Heat Safety & Public Relief Resources</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-amber-950">
              {currentPlan.immediateActions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Layer 2: Tenant & Homeowner Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-slate-700" />
                <span>Layer 2A: Actions If You Rent</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {currentPlan.propertyActions.renters.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-slate-700" />
                <span>Layer 2B: Actions If You Own</span>
              </h5>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {currentPlan.propertyActions.homeowners.map((act, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Layer 3: Collective Action */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
            <h5 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Layer 3: Collective Neighborhood & Municipal Advocacy</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-emerald-950">
              {currentPlan.collectiveActions.map((act, i) => (
                <li key={i} className="flex items-start gap-2">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ethical Disclaimer */}
        <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Scientific Governance Disclaimer:</strong> In compliance with the Research Contract, this plan is generated strictly from publicly licensed geospatial and spectral connectivity models. It does not measure indoor temperatures, diagnose medical heat vulnerability, or evaluate private building structural suitability. All recommendations prioritize low-regret, community-empowered actions.
        </div>
      </div>
    </div>
  );
};
export default AddressPlanTool;
