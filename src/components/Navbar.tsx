import React from 'react';
import { 
  BookOpen, 
  FlaskConical, 
  ShieldCheck, 
  FileText, 
  Layers, 
  Award, 
  ExternalLink, 
  Sparkles, 
  ArrowRight,
  Flame,
  Globe
} from 'lucide-react';
import { TARGET_METADATA } from '../data/evaluationData';

export type MainView = 'monograph' | 'workbench' | 'policy' | 'verification' | 'audit';

interface NavbarProps {
  currentView: MainView;
  onSelectView: (view: MainView) => void;
  subTool?: string;
  onSelectSubTool?: (toolId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  subTool,
  onSelectSubTool
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      {/* Top Utility Ribbon */}
      <div className="border-b border-slate-800/60 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0">
              <Award className="w-3 h-3" />
              <span className="hidden sm:inline">Pioneering Research Monograph & Live Climatology Platform</span>
              <span className="sm:hidden">Research Monograph</span>
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="hidden md:inline text-slate-400 truncate">
              Spectral Geometry & Urban Resource Equity
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="https://github.com/aartisr/urban-heat-democratization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors hidden md:inline-flex items-center gap-1 font-mono text-[10px]"
            >
              <span>github.com/aartisr/urban-heat-democratization</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-slate-700 hidden md:inline">|</span>
            <a
              href={TARGET_METADATA.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 shadow-sm text-[11px]"
              title="Open the live deployment at urban-heat.ai-aarti.com"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Live Site: </span>
              <span>urban-heat.ai-aarti.com</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectView('monograph')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 via-emerald-500/20 to-amber-500/20 border border-indigo-500/30 text-indigo-400 group-hover:border-indigo-400 transition-colors">
                <Flame className="w-5 h-5 text-amber-400" />
                <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-slate-950">
                  <ShieldCheck className="w-2.5 h-2.5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight leading-none group-hover:text-indigo-300 transition-colors">
                    Urban Heat Spectral Climatology
                  </h1>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    PNAS Monograph
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Normalized Laplacians • Cheeger Cuts • Climate Equity
                </p>
              </div>
            </button>
          </div>

          {/* Core Mode Switcher Tabs */}
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              id="nav-tab-monograph"
              onClick={() => onSelectView('monograph')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentView === 'monograph'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 ring-1 ring-indigo-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Research Monograph</span>
            </button>

            <button
              id="nav-tab-workbench"
              onClick={() => onSelectView('workbench')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentView === 'workbench'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Live Simulation Lab</span>
            </button>

            <button
              id="nav-tab-policy"
              onClick={() => onSelectView('policy')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentView === 'policy'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30 ring-1 ring-amber-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Civic Policy & Grants</span>
            </button>

            <button
              id="nav-tab-verification"
              onClick={() => onSelectView('verification')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentView === 'verification'
                  ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/30 ring-1 ring-teal-400'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verification Matrix</span>
            </button>

            <button
              id="nav-tab-audit"
              onClick={() => onSelectView('audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                currentView === 'audit'
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Platform Audit</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block mx-0.5" />

            <a
              id="nav-direct-live-site-btn"
              href={TARGET_METADATA.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/50 text-emerald-300 hover:text-emerald-100 shadow-sm group"
              title="Open the official live deployment at urban-heat.ai-aarti.com"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Live Site</span>
              <ExternalLink className="w-3 h-3 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </nav>
        </div>

        {/* Contextual Sub-Bar for Live Lab & Policy */}
        {currentView === 'workbench' && onSelectSubTool && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Lab Suites:
            </span>
            {[
              { id: 'mitigation_lab', label: '🌡️ Mitigation Sandbox' },
              { id: 'filter', label: '📐 Spectral Laplacian Studio' },
              { id: 'sensor', label: '📡 Sensor Validation Bench' },
              { id: 'calculator', label: '⚖️ Conductance Calculator' },
              { id: 'osm', label: '🗺️ OSM Multi-City Pipeline' },
              { id: 'gis', label: '🛰️ Open GIS Ingestion' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelectSubTool(tool.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  subTool === tool.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}

        {currentView === 'policy' && onSelectSubTool && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Civic Modules:
            </span>
            {[
              { id: 'grant_pdf', label: '📄 Municipal Grant & Bond Brief' },
              { id: 'address_plan', label: '📍 Address-Level Action Planner' },
              { id: 'multilingual', label: '🌐 Multilingual Equity Portal' },
              { id: 'prs', label: '🛠️ Upstream PR Contributions' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => onSelectSubTool(tool.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  subTool === tool.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
