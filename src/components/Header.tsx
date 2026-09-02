import React from 'react';
import { LabStepId } from '../types';
import { Flame, BookOpen, Terminal, ShieldCheck, Sparkles, Sliders, Layers, Eye, Grid } from 'lucide-react';

interface HeaderProps {
  activeTab: LabStepId;
  onSelectTab: (tab: LabStepId) => void;
  onOpenAIModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onSelectTab, onOpenAIModal }) => {
  const tabs: { id: LabStepId; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'lab1-basic-uhi', label: 'Lab 1: Basic UHI', icon: <Flame className="w-3.5 h-3.5" />, badge: 'Step 1' },
    { id: 'lab2-radiation', label: 'Lab 2: Radiation', icon: <BookOpen className="w-3.5 h-3.5" />, badge: 'Step 2' },
    { id: 'lab3-energy-balance', label: 'Lab 3: Energy Balance', icon: <Sliders className="w-3.5 h-3.5" />, badge: 'Step 3' },
    { id: 'lab4-thermal-inertia', label: 'Lab 4: Thermal Inertia', icon: <Layers className="w-3.5 h-3.5" />, badge: 'Step 4' },
    { id: 'lab5-canyon-svf', label: 'Lab 5: Urban Canyon', icon: <Eye className="w-3.5 h-3.5" />, badge: 'Step 5' },
    { id: 'lab6-gmrf-spatial', label: 'Lab 6: GMRF Graph', icon: <Grid className="w-3.5 h-3.5" />, badge: 'Step 6' },
    { id: 'toy-calculator', label: 'Toy Calculator', icon: <Terminal className="w-3.5 h-3.5" />, badge: 'Interactive' },
    { id: 'scenario-sandbox', label: 'Mitigation Sandbox', icon: <ShieldCheck className="w-3.5 h-3.5" />, badge: 'Planners' }
  ];

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-tight">Spectral Urbanism</h1>
              <p className="text-[11px] text-slate-400 font-mono">Urban Thermal Math Deep Dive Lab</p>
            </div>
          </div>

          {/* AI Tutor Button */}
          <button
            onClick={onOpenAIModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>AI Thermal Science Tutor</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none text-xs">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
