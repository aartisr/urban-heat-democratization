import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Sparkles, 
  FileText,
  Star,
  ExternalLink,
  Target
} from 'lucide-react';
import { DIMENSIONS, TARGET_METADATA } from '../data/evaluationData';
import { DimensionScore } from '../types';

export const DimensionAuditList: React.FC = () => {
  const [selectedDimensionId, setSelectedDimensionId] = useState<string>(DIMENSIONS[0].id);

  const selectedDimension = DIMENSIONS.find(d => d.id === selectedDimensionId) || DIMENSIONS[0];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Six Core Evaluation Dimensions</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detailed criteria-level audit of <a href={TARGET_METADATA.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">{TARGET_METADATA.url}</a> across 18 granular sub-metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Standard Weighted Score:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-sm">
            {TARGET_METADATA.overallScore} / 10.0
          </span>
        </div>
      </div>

      {/* Interactive Tabs / Dimension Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {DIMENSIONS.map((dim) => {
          const isSelected = dim.id === selectedDimensionId;
          return (
            <button
              key={dim.id}
              onClick={() => setSelectedDimensionId(dim.id)}
              id={`pill-dim-${dim.id}`}
              className={`p-3 rounded-xl text-left transition-all border flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 text-white shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold block uppercase tracking-wider text-slate-400 truncate">
                  {dim.category}
                </span>
                <span className="text-xs font-bold block mt-1 text-slate-200 line-clamp-1">
                  {dim.title}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-xs font-mono font-black text-emerald-400">
                  {dim.score.toFixed(1)} <span className="text-[10px] text-slate-500 font-normal">/10</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  {(dim.weight * 100).toFixed(0)}% wt
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Dimension Deep Dive Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        {/* Dimension Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase tracking-wider">
                {selectedDimension.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Evaluation Weight: {(selectedDimension.weight * 100).toFixed(0)}%
              </span>
            </div>
            <h3 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              {selectedDimension.title}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {selectedDimension.summary}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold uppercase">Dimension Rating</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-400">{selectedDimension.score.toFixed(1)}</span>
                <span className="text-xs font-bold text-slate-500">/ 10</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <Star className="w-6 h-6 fill-emerald-400/20 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Sub-Criteria Rating Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Granular Sub-Criteria Rubric Scoring</span>
          </h4>

          <div className="space-y-3">
            {selectedDimension.subCriteria.map((sub) => {
              const subPercentage = (sub.score / sub.maxScore) * 100;
              const verdictColors = {
                exceptional: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                strong: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
                adequate: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                'needs-work': 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              };

              return (
                <div 
                  key={sub.id} 
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  id={`subcrit-${sub.id}`}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{sub.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${verdictColors[sub.verdict]}`}>
                        {sub.verdict}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Sub-weight: {(sub.weight * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {sub.commentary}
                    </p>
                  </div>

                  <div className="w-full md:w-48 shrink-0">
                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                      <span className="text-slate-400">Score</span>
                      <span className="font-bold text-emerald-400">{sub.score.toFixed(1)} / {sub.maxScore}</span>
                    </div>
                    <div className="w-full bg-slate-700/60 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                        style={{ width: `${subPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Strengths & Growth Areas in Active Dimension */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-emerald-500/20">
            <h5 className="text-xs font-bold text-emerald-300 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Demonstrated Strengths</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedDimension.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold mt-0.5">•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-amber-500/20">
            <h5 className="text-xs font-bold text-amber-300 flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Identified Growth Opportunities</span>
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {selectedDimension.growthAreas.map((ga, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold mt-0.5">•</span>
                  <span>{ga}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Strategic Recommendation */}
        <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/30 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Expert Recommendation for this Dimension</span>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {selectedDimension.recommendation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
