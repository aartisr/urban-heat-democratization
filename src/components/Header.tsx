import React from 'react';
import { ExternalLink, ShieldCheck, Award, Flame, Sparkles } from 'lucide-react';
import { TARGET_METADATA } from '../data/evaluationData';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'overview', label: 'Audit Scorecard & Verdict' },
    { id: 'dimensions', label: '6 Deep-Dive Dimensions' },
    { id: 'calculator', label: 'Interactive Weighting Tool' },
    { id: 'mitigation_lab', label: 'Interactive Mitigation Lab' },
    { id: 'benchmarks', label: 'Platform Benchmarking' },
    { id: 'swot', label: 'SWOT Analysis' },
    { id: 'roadmap', label: 'Roadmap to 10.0 / 10' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-emerald-500/20 border border-amber-500/30 text-amber-400">
              <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
              <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full text-slate-950">
                <ShieldCheck className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Urban Heat Platform Evaluation
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Score: {TARGET_METADATA.overallScore} / 10
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Tier 1 Civic Tech
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                Target: <a 
                  href={TARGET_METADATA.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-emerald-400 hover:text-emerald-300 underline font-mono inline-flex items-center gap-0.5"
                >
                  {TARGET_METADATA.url} <ExternalLink className="w-3 h-3 inline" />
                </a>
                <span className="text-slate-600">•</span>
                <span>By {TARGET_METADATA.creator} ({TARGET_METADATA.organization})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={TARGET_METADATA.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm"
              id="visit-target-button"
            >
              <span>Visit Live Platform</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Independent Expert Audit</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-3.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
