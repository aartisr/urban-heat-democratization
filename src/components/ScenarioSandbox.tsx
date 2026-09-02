import React, { useState } from 'react';
import { ScenarioIntervention, ScenarioResult } from '../types';
import { Sliders, ShieldCheck, TreePine, Home, Car, Droplet, Sparkles, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const ScenarioSandbox: React.FC = () => {
  const [interventions, setInterventions] = useState<ScenarioIntervention>({
    coolRoofsPercentage: 40,
    urbanTreeCanopyPercentage: 30,
    permeablePavementPercentage: 25,
    evReductionPercentage: 50
  });

  // Calculate mitigation impact
  const baselineTemp = 36.5; // °C baseline hot summer day

  const coolRoofImpact = (interventions.coolRoofsPercentage / 100) * 1.8; // up to -1.8°C
  const treeCanopyImpact = (interventions.urbanTreeCanopyPercentage / 100) * 2.8; // up to -2.8°C
  const pavementImpact = (interventions.permeablePavementPercentage / 100) * 1.2; // up to -1.2°C
  const evImpact = (interventions.evReductionPercentage / 100) * 0.9; // up to -0.9°C

  const totalReduction = Math.round((coolRoofImpact + treeCanopyImpact + pavementImpact + evImpact) * 100) / 100;
  const mitigatedTemp = Math.round((baselineTemp - totalReduction) * 100) / 100;

  const heatStressHoursSaved = Math.round(totalReduction * 110);
  const carbonOffsetEquiv = Math.round(totalReduction * 420);

  const chartData = [
    { name: 'Tree Canopy', val: Math.round(treeCanopyImpact * 100) / 100, color: '#10b981' },
    { name: 'Cool Roofs', val: Math.round(coolRoofImpact * 100) / 100, color: '#38bdf8' },
    { name: 'Permeable Paving', val: Math.round(pavementImpact * 100) / 100, color: '#f59e0b' },
    { name: 'EV Transition', val: Math.round(evImpact * 100) / 100, color: '#a855f7' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Mitigation Sandbox</span>
          <span>•</span>
          <span>Urban Climate Resilience</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Urban Heat Island Mitigation & Climate Resilience Sandbox</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Simulate city-scale cooling interventions by combining cool high-albedo roofs, urban forestry tree canopies, permeable cool pavements, and electrification of transport waste heat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Intervention Sliders */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Intervention Adoption Rates</span>
            </h3>
            <button
              onClick={() => setInterventions({
                coolRoofsPercentage: 40,
                urbanTreeCanopyPercentage: 30,
                permeablePavementPercentage: 25,
                evReductionPercentage: 50
              })}
              className="text-xs text-slate-400 hover:text-emerald-400 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Urban Tree Canopy */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <TreePine className="w-3.5 h-3.5 text-emerald-400" /> Urban Tree Canopy Expansion
              </span>
              <span className="font-mono text-emerald-400 font-bold">{interventions.urbanTreeCanopyPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={interventions.urbanTreeCanopyPercentage}
              onChange={e => setInterventions({ ...interventions, urbanTreeCanopyPercentage: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Cool Roofs */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-sky-400" /> High-Albedo Cool Roof Retrofit
              </span>
              <span className="font-mono text-sky-400 font-bold">{interventions.coolRoofsPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={interventions.coolRoofsPercentage}
              onChange={e => setInterventions({ ...interventions, coolRoofsPercentage: parseFloat(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Permeable Pavements */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-amber-400" /> Cool Permeable Pavements
              </span>
              <span className="font-mono text-amber-400 font-bold">{interventions.permeablePavementPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={interventions.permeablePavementPercentage}
              onChange={e => setInterventions({ ...interventions, permeablePavementPercentage: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* EV Transition */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-purple-400" /> Traffic Electrification (Q_F Reduction)
              </span>
              <span className="font-mono text-purple-400 font-bold">{interventions.evReductionPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={interventions.evReductionPercentage}
              onChange={e => setInterventions({ ...interventions, evReductionPercentage: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Results & Impact Charts */}
        <div className="lg:col-span-7 space-y-5">
          {/* Output Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Baseline Hot Temp</span>
              <span className="text-lg font-bold font-mono text-red-400">{baselineTemp} °C</span>
            </div>
            <div className="bg-slate-900 border border-emerald-500/30 bg-emerald-500/5 p-3 rounded-xl">
              <span className="text-emerald-400 font-semibold block text-[10px]">Mitigated Temp</span>
              <span className="text-xl font-extrabold font-mono text-emerald-300">{mitigatedTemp} °C</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Net Cooling (ΔT_saved)</span>
              <span className="text-lg font-bold font-mono text-amber-400 flex items-center justify-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" /> -{totalReduction} °C
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Heat Stress Hrs Saved</span>
              <span className="text-lg font-bold font-mono text-cyan-400">{heatStressHoursSaved} hrs/yr</span>
            </div>
          </div>

          {/* Breakdown Chart */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cooling Contribution by Intervention (°C Temperature Reduction)</span>
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 3.0]} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} formatter={(val: any) => [`-${val} °C`, 'Cooling']} />
                  <Bar dataKey="val" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
