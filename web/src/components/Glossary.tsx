import { useState } from 'react';
import { GlossaryItem } from '../types';
import { BookOpen, Search, ArrowRight, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: "Fiedler Vector",
    definition: "The eigenvector corresponding to the second smallest eigenvalue of the normalized graph Laplacian matrix.",
    context: "In this repository, it is used in the Fiedler-vector Cheeger sweep to bisect the urban graph into optimal high-connectivity partitions, highlighting structural disconnects in cooling and heat accessibility."
  },
  {
    term: "Cheeger Bottleneck / Conductance",
    definition: "A ratio comparing the connection strength (boundary size) between two sets of nodes relative to their volumes. Lower conductance indicates a tighter bottleneck.",
    context: "The platform computes Cheeger cuts on the weighted urban graph to find physical barriers (like highways or rivers) that cut off communities from nearby cooling resources."
  },
  {
    term: "Spectral Gap",
    definition: "The difference between the smallest (always 0 for connected graphs) and second-smallest eigenvalue of the Laplacian matrix.",
    context: "A larger spectral gap suggests a highly connected and structurally robust city for cooling-access dispersion. The code includes fixed reference tests to verify this value."
  },
  {
    term: "Normalized Laplacian",
    definition: "The matrix L = I - D^(-1/2) * W * D^(-1/2), where W is the adjacency weight matrix and D is the degree matrix.",
    context: "This matrix is the mathematical core of the spectral analysis. It accounts for varying neighborhood densities, preventing larger parks or high-degree arterial transit routes from skewing the community access signal."
  },
  {
    term: "Evidence Readiness",
    definition: "A standard defined in the project's glossary to rate how actionable and reliable spatial layers are before public agencies use them for targeting program budgets.",
    context: "Distinguishes between raw satellite readings, modeled proxies, and decision-ready datasets that have undergone validation and sensitivity analysis."
  },
  {
    term: "Upload-First Cities",
    definition: "Cities in the platform (like New York, Chicago, LA) where the user must upload local administrative or physical boundary files to initialize the study workflow.",
    context: "In contrast to Boston (which has pre-bundled GIS layers), this allows the platform's backend to remain lightweight while enabling infinite custom city support."
  }
];

export default function Glossary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string | null>(GLOSSARY_ITEMS[0].term);

  const filteredItems = GLOSSARY_ITEMS.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeItem = GLOSSARY_ITEMS.find(item => item.term === selectedTerm) || GLOSSARY_ITEMS[0];

  return (
    <div id="glossary-section" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <BookOpen className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Project Glossary & Methodology</h3>
      </div>
      
      <p className="text-sm text-slate-500 mb-5 leading-relaxed">
        The repository leverages advanced mathematical concepts in spectral graph theory to model cooling accessibility. Use this interactive glossary to explore the core analytical terms.
      </p>

      {/* Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search glossary terms..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Term List */}
        <div className="md:col-span-2 border-r border-slate-100 pr-0 md:pr-4 max-h-72 overflow-y-auto space-y-1">
          {filteredItems.map((item) => (
            <button
              key={item.term}
              onClick={() => setSelectedTerm(item.term)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                selectedTerm === item.term
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{item.term}</span>
              {selectedTerm === item.term && <ArrowRight className="w-4 h-4 text-white/80" />}
            </button>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-xs text-slate-400 p-2 text-center">No matching terms found.</p>
          )}
        </div>

        {/* Term Definition Detail */}
        <div className="md:col-span-3 bg-slate-50/50 p-5 rounded-2xl border border-slate-50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Definition</span>
            <h4 className="text-base font-bold text-slate-800 mt-1 mb-2">{activeItem.term}</h4>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">{activeItem.definition}</p>
          </div>

          <div className="pt-4 border-t border-slate-100 bg-white/60 p-4 rounded-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
              <CornerDownRight className="w-3.5 h-3.5" /> Context in Repository
            </span>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              {activeItem.context}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
