import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Lightbulb, 
  ShieldAlert, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { SWOT_DATA } from '../data/evaluationData';

export const SWOTMatrix: React.FC = () => {
  const strengths = SWOT_DATA.filter(item => item.category === 'strength');
  const weaknesses = SWOT_DATA.filter(item => item.category === 'weakness');
  const opportunities = SWOT_DATA.filter(item => item.category === 'opportunity');
  const threats = SWOT_DATA.filter(item => item.category === 'threat');

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <span>Strategic SWOT Analysis</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Comprehensive strategic breakdown of internal capabilities and external opportunities for <strong>urban-heat.ai-aarti.com</strong>.
        </p>
      </div>

      {/* 2x2 SWOT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
            <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Strengths (Internal Advantages)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
              High Impact
            </span>
          </div>
          <div className="space-y-2.5">
            {strengths.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/20">
                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weaknesses */}
        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Weaknesses (Current Constraints)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
              Actionable
            </span>
          </div>
          <div className="space-y-2.5">
            {weaknesses.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20">
                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities */}
        <div className="p-5 rounded-2xl bg-teal-950/20 border border-teal-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-teal-500/20">
            <h3 className="text-sm font-bold text-teal-300 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-teal-400" />
              <span>Opportunities (Growth Vectors)</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
              High Leverage
            </span>
          </div>
          <div className="space-y-2.5">
            {opportunities.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-teal-500/20">
                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Threats */}
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Threats & External Risks</span>
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              Manageable
            </span>
          </div>
          <div className="space-y-2.5">
            {threats.map(item => (
              <div key={item.id} className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                <h4 className="text-xs font-bold text-white mb-1">{item.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
