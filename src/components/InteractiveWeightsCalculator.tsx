import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Award, 
  Check, 
  Scale, 
  Users, 
  Building2, 
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { DIMENSIONS, PERSONA_PROFILES } from '../data/evaluationData';

export const InteractiveWeightsCalculator: React.FC = () => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('balanced');
  const [customWeights, setCustomWeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    DIMENSIONS.forEach(d => {
      initial[d.id] = d.weight * 100;
    });
    return initial;
  });

  const handlePersonaSelect = (personaId: string) => {
    setSelectedPersonaId(personaId);
    const persona = PERSONA_PROFILES.find(p => p.id === personaId);
    if (persona) {
      const updated: Record<string, number> = {};
      DIMENSIONS.forEach(d => {
        updated[d.id] = (persona.weights[d.id] ?? 0.15) * 100;
      });
      setCustomWeights(updated);
    }
  };

  const handleSliderChange = (dimId: string, value: number) => {
    setSelectedPersonaId('custom');
    setCustomWeights(prev => ({
      ...prev,
      [dimId]: value
    }));
  };

  const resetToDefault = () => {
    handlePersonaSelect('balanced');
  };

  // Calculate normalized weights and composite score
  const totalWeightRaw = (Object.values(customWeights) as number[]).reduce((sum: number, w: number) => sum + w, 0);
  const safeTotalWeight = (totalWeightRaw === 0 ? 1 : totalWeightRaw) as number;

  let weightedScoreSum = 0;
  DIMENSIONS.forEach(dim => {
    const rawWeight: number = customWeights[dim.id] ?? 0;
    const normalizedWeight = rawWeight / safeTotalWeight;
    weightedScoreSum += dim.score * normalizedWeight;
  });

  const finalCompositeScore = Number(weightedScoreSum.toFixed(2));

  // Determine grade title based on calculated score
  const getGradeMeta = (score: number) => {
    if (score >= 9.0) return { label: 'A+ / Extraordinary', color: 'text-emerald-300', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 8.5) return { label: 'A / Exceptional', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 8.0) return { label: 'A- / Highly Commended', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' };
    if (score >= 7.0) return { label: 'B+ / Strong', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
    return { label: 'Adequate', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
  };

  const gradeMeta = getGradeMeta(finalCompositeScore);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-2 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-400" />
          <span>Interactive Weighting & Persona Calculator</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Adjust the importance of each dimension according to your stakeholder perspective (Community, City Planner, Scientist) to recalculate the composite score for <strong>urban-heat.ai-aarti.com</strong>.
        </p>
      </div>

      {/* Preset Persona Selector */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Select Stakeholder Perspective / Persona Preset
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PERSONA_PROFILES.map((persona) => {
            const isSelected = selectedPersonaId === persona.id;
            const Icon = persona.id === 'balanced' ? Scale :
                         persona.id === 'community_advocate' ? Users :
                         persona.id === 'urban_planner' ? Building2 : GraduationCap;
            return (
              <button
                key={persona.id}
                onClick={() => handlePersonaSelect(persona.id)}
                id={`persona-${persona.id}`}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-emerald-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-emerald-500 text-slate-950">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">{persona.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-tight">{persona.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Calculation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Area (8 cols) */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Dimension Weight Adjusters</h3>
            <button
              onClick={resetToDefault}
              className="text-xs text-slate-400 hover:text-emerald-400 font-semibold flex items-center gap-1 transition"
              id="reset-weights-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <div className="space-y-4">
            {DIMENSIONS.map((dim) => {
              const rawWeight = customWeights[dim.id] || 0;
              const effectivePercentage = ((rawWeight / safeTotalWeight) * 100).toFixed(1);
              return (
                <div key={dim.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-200">{dim.title}</span>
                      <span className="text-[11px] text-slate-500 ml-2 font-mono">
                        (Raw Grade: {dim.score.toFixed(1)}/10)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {effectivePercentage}% Weight
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={rawWeight}
                      onChange={(e) => handleSliderChange(dim.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                      id={`slider-${dim.id}`}
                    />
                    <span className="text-xs font-mono text-slate-400 w-8 text-right">{rawWeight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Recalculated Score Card (4 cols) */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Dynamic Recomputed Score</span>
            </div>

            <div className="text-center py-4 border-y border-slate-800 my-2">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300 tracking-tight font-mono">
                {finalCompositeScore.toFixed(2)}
              </span>
              <span className="text-2xl font-bold text-slate-500 ml-1">/ 10</span>
              <div className={`mt-3 px-3 py-1 rounded-lg text-xs font-bold border inline-block ${gradeMeta.bg} ${gradeMeta.color}`}>
                {gradeMeta.label}
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mt-4">
              Even across varying stakeholder weightings, <strong>urban-heat.ai-aarti.com</strong> consistently scores within the <strong>8.7 – 9.3</strong> band due to its dual strength in both rigorous satellite modeling and accessible civic storytelling.
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Standard Baseline:</span>
              <span className="font-mono text-slate-200 font-bold">8.90 / 10</span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Custom Delta:</span>
              <span className={`font-mono font-bold ${finalCompositeScore >= 8.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {finalCompositeScore >= 8.9 ? '+' : ''}{(finalCompositeScore - 8.90).toFixed(2)} pts
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
