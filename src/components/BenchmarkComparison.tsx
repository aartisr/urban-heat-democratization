import React from 'react';
import { 
  BarChart3, 
  ExternalLink, 
  Check, 
  ShieldCheck, 
  Sparkles,
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { BENCHMARKS, TARGET_METADATA } from '../data/evaluationData';

export const BenchmarkComparison: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          <span>Comparative Platform Benchmark</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Benchmarking <strong>urban-heat.ai-aarti.com</strong> against leading governmental, non-profit, and commercial urban heat mapping systems.
        </p>
      </div>

      {/* Comparative Matrix Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700">
            <tr>
              <th className="py-3.5 px-4">Platform</th>
              <th className="py-3.5 px-3 text-center">Open Science</th>
              <th className="py-3.5 px-3 text-center">UX Simplicity</th>
              <th className="py-3.5 px-3 text-center">Local Action</th>
              <th className="py-3.5 px-3 text-center">Equity Centering</th>
              <th className="py-3.5 px-4 text-center">Overall Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {BENCHMARKS.map((item, index) => {
              const isTarget = index === 0;
              return (
                <tr 
                  key={item.name} 
                  className={`transition-colors ${
                    isTarget 
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/15 font-medium' 
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                  id={`benchmark-row-${index}`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {isTarget && (
                        <span className="p-1 rounded bg-emerald-500 text-slate-950">
                          <Award className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {isTarget && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-slate-950 uppercase tracking-wide">
                              Subject of Audit
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {item.focus}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-4 px-3 text-center font-mono">
                    <span className="font-bold text-slate-200">{item.openScienceScore.toFixed(1)}</span>
                    <span className="text-slate-500 text-[10px]"> /10</span>
                  </td>

                  <td className="py-4 px-3 text-center font-mono">
                    <span className="font-bold text-slate-200">{item.uxSimplicityScore.toFixed(1)}</span>
                    <span className="text-slate-500 text-[10px]"> /10</span>
                  </td>

                  <td className="py-4 px-3 text-center font-mono">
                    <span className="font-bold text-slate-200">{item.localActionScore.toFixed(1)}</span>
                    <span className="text-slate-500 text-[10px]"> /10</span>
                  </td>

                  <td className="py-4 px-3 text-center font-mono">
                    <span className="font-bold text-slate-200">{item.equityFocusScore.toFixed(1)}</span>
                    <span className="text-slate-500 text-[10px]"> /10</span>
                  </td>

                  <td className="py-4 px-4 text-center font-mono">
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-black inline-block ${
                      isTarget 
                        ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                        : 'bg-slate-800 text-slate-200 border border-slate-700'
                    }`}>
                      {item.overallScore.toFixed(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Comparative Qualitative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {BENCHMARKS.map((item, index) => {
          const isTarget = index === 0;
          return (
            <div 
              key={item.name}
              className={`p-4 rounded-xl border transition-all ${
                isTarget 
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-md' 
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  {item.name}
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {item.overallScore.toFixed(1)} / 10
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {item.comparisonNote}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
