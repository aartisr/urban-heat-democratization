import React, { useState } from 'react';
import { FormulaCard } from './FormulaCard';
import { CodeModuleViewer } from './CodeModuleViewer';
import { LaTeXText } from './MathFormula';
import { BasicUHIParams } from '../types';
import { calculateBasicUHI } from '../lib/thermalMath';
import { Thermometer, Sliders, Layers, Sun, Wind, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Lab1Props {
  onAskAI: (prompt: string) => void;
}

export const Lab1BasicUHI: React.FC<Lab1Props> = ({ onAskAI }) => {
  const [params, setParams] = useState<BasicUHIParams>({
    aspectRatio: 1.2,
    vegetationFraction: 0.15,
    imperviousFraction: 0.75,
    anthropogenicHeat: 45,
    skyViewFactor: 0.55,
    ruralBaselineTemp: 24.0
  });

  const result = calculateBasicUHI(params);

  const chartData = [
    { name: 'Aspect Ratio (H/W)', val: result.contributions.aspectRatioImpact, color: '#f59e0b' },
    { name: 'Veg Cooling (FVC)', val: result.contributions.vegetationCooling, color: '#10b981' },
    { name: 'Impervious (I)', val: result.contributions.imperviousHeating, color: '#ef4444' },
    { name: 'Anthropogenic (Q_F)', val: result.contributions.anthropogenicHeating, color: '#f97316' },
    { name: 'Sky Trapping (SVF)', val: result.contributions.skyTrappingHeating, color: '#8b5cf6' }
  ];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <span>Step 1 of 6</span>
              <span>•</span>
              <span>Basic Heat Island Model</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Lab 1: Urban Heat Island (UHI) Thermal Equilibrium</h2>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Heat Category</span>
            <span className={`text-lg font-bold ${
              result.urbanHeatCategory === 'Extreme' ? 'text-red-400' :
              result.urbanHeatCategory === 'Severe' ? 'text-amber-400' :
              result.urbanHeatCategory === 'Moderate' ? 'text-yellow-400' : 'text-emerald-400'
            }`}>
              {result.urbanHeatCategory} (+{result.deltaTUHI} °C)
            </span>
          </div>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          <LaTeXText text="The Urban Heat Island (UHI) effect measures the thermal discrepancy between built urban microclimates and surrounding rural reference regions ($\Delta T_{UHI} = T_{\text{urban}} - T_{\text{rural}}$). Explore how geometry, vegetation loss, and waste heat drive temperature spikes." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Parameter Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Interactive Microclimate Controls</span>
            </h3>
            <button
              onClick={() => setParams({
                aspectRatio: 1.2,
                vegetationFraction: 0.15,
                imperviousFraction: 0.75,
                anthropogenicHeat: 45,
                skyViewFactor: 0.55,
                ruralBaselineTemp: 24.0
              })}
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Reset Default
            </button>
          </div>

          {/* Aspect Ratio H/W */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Canyon Aspect Ratio (H/W)</span>
              <span className="font-mono text-amber-400 font-bold">{params.aspectRatio}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.5"
              step="0.1"
              value={params.aspectRatio}
              onChange={e => setParams({ ...params, aspectRatio: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.1 (Suburbs/Open)</span>
              <span>1.5 (Standard)</span>
              <span>3.5 (High-rise)</span>
            </div>
          </div>

          {/* Vegetation Fraction FVC */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Vegetation Fraction Cover (FVC)</span>
              <span className="font-mono text-emerald-400 font-bold">{(params.vegetationFraction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.8"
              step="0.05"
              value={params.vegetationFraction}
              onChange={e => setParams({ ...params, vegetationFraction: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Asphalt jungle)</span>
              <span>40% (Suburban Park)</span>
              <span>80% (Dense Canopy)</span>
            </div>
          </div>

          {/* Impervious Fraction I */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Impervious Surface Fraction (I)</span>
              <span className="font-mono text-red-400 font-bold">{(params.imperviousFraction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.05"
              value={params.imperviousFraction}
              onChange={e => setParams({ ...params, imperviousFraction: parseFloat(e.target.value) })}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          {/* Anthropogenic Heat Q_F */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Anthropogenic Waste Heat (Q_F)</span>
              <span className="font-mono text-orange-400 font-bold">{params.anthropogenicHeat} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={params.anthropogenicHeat}
              onChange={e => setParams({ ...params, anthropogenicHeat: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 (Rural)</span>
              <span>50 (Urban Avg)</span>
              <span>150 (Dense Industrial)</span>
            </div>
          </div>

          {/* Sky View Factor SVF */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Sky View Factor (SVF)</span>
              <span className="font-mono text-purple-400 font-bold">{params.skyViewFactor}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={params.skyViewFactor}
              onChange={e => setParams({ ...params, skyViewFactor: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.1 (Trapped Canyon)</span>
              <span>0.5 (Narrow Street)</span>
              <span>1.0 (Flat Field)</span>
            </div>
          </div>

          {/* Rural Baseline Temp */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Rural Reference Temperature (T_rural)</span>
              <span className="font-mono text-cyan-400 font-bold">{params.ruralBaselineTemp} °C</span>
            </div>
            <input
              type="range"
              min="10.0"
              max="40.0"
              step="0.5"
              value={params.ruralBaselineTemp}
              onChange={e => setParams({ ...params, ruralBaselineTemp: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Temperature Comparison & Factor Contributions */}
        <div className="lg:col-span-7 space-y-5">
          {/* Main Anomaly Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Rural Baseline</span>
              <div className="text-2xl font-bold text-cyan-400 font-mono">{params.ruralBaselineTemp} °C</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Reference Environment</span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 bg-amber-500/5 p-4 rounded-xl text-center">
              <span className="text-xs text-amber-400 uppercase tracking-wider block mb-1 font-semibold">UHI Anomaly (ΔT)</span>
              <div className="text-3xl font-extrabold text-amber-300 font-mono">+{result.deltaTUHI} °C</div>
              <span className="text-[11px] text-amber-400/80 mt-1 block">Thermal Discrepancy</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Urban Microclimate</span>
              <div className="text-2xl font-bold text-red-400 font-mono">{result.urbanTemp} °C</div>
              <span className="text-[11px] text-slate-500 mt-1 block">Predicted Surface Temp</span>
            </div>
          </div>

          {/* Oke Formula Comparison */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-300">
              Oke Canopy Max Anomaly (<span className="font-mono text-amber-400">H/W = {params.aspectRatio}</span>):
            </span>
            <span className="font-mono font-bold text-amber-300 text-sm">+{result.okeMaxDeltaT} °C</span>
          </div>

          {/* Factor Contribution Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>Thermal Factor Contributions to <LaTeXText text="$\Delta T_{UHI}$" /> (°C)</span>
            </h4>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} domain={[-5, 5]} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={10} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    formatter={(val: any) => [`${Number(val) > 0 ? '+' : ''}${val} °C`, 'Impact']}
                  />
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

      {/* Equations Breakdown */}
      <FormulaCard
        title="Urban Heat Island Basic Anomaly & Oke Canopy Formula"
        formula="\Delta T_{UHI} = T_{urban} - T_{rural} \approx \alpha (1 - \text{FVC}) + \beta \cdot I + \gamma \frac{Q_F}{c_p \rho d} + \delta (1 - \text{SVF})"
        description="The primary thermal anomaly equation relates urban temperature elevation to structural, vegetation, and energy emission parameters. Oke's canopy formula provides an upper asymptote based purely on street canyon geometry."
        variables={[
          { symbol: 'ΔT_UHI', name: 'UHI Anomaly', unit: '°C', description: 'Thermal elevation over rural baseline' },
          { symbol: 'FVC', name: 'Vegetation Cover', unit: '0..1', description: 'Evapotranspirative green cover fraction' },
          { symbol: 'I', name: 'Impervious Cover', unit: '0..1', description: 'Asphalt & concrete surface fraction' },
          { symbol: 'Q_F', name: 'Anthropogenic Heat', unit: 'W/m²', description: 'Waste heat from HVAC & transportation' },
          { symbol: 'SVF', name: 'Sky View Factor', unit: '0..1', description: 'Fraction of unblocked sky visible from ground' },
          { symbol: 'H/W', name: 'Aspect Ratio', unit: 'ratio', description: 'Building height divided by street width' }
        ]}
        physicalIntuition="Urban canyons trap longwave radiation, while asphalt surfaces substitute natural soil evapotranspiration with sensible heat. High-density structures re-radiate absorbed daytime solar energy late into the night."
        onAskAI={onAskAI}
      />

      {/* Code Module Viewer */}
      <CodeModuleViewer
        title="Executable TypeScript Code Module: Basic UHI Calculation"
        stepNumber={1}
        codeSnippet={`function calculateBasicUHI(params: BasicUHIParams): number {
  const okeMaxDeltaT = 7.54 * Math.log10(Math.max(0.1, params.aspectRatio)) + 3.73;
  
  const vegCooling = -4.2 * params.vegetationFraction;
  const imperviousHeating = 3.5 * params.imperviousFraction;
  const anthropogenicHeating = 0.035 * params.anthropogenicHeat;
  const skyTrapping = 2.8 * (1 - params.skyViewFactor);
  const aspectImpact = 1.4 * (params.aspectRatio - 0.5);

  const deltaT = Math.max(0, vegCooling + imperviousHeating + anthropogenicHeating + skyTrapping + aspectImpact);
  return Number(deltaT.toFixed(2));
}`}
        calculatedValues={{
          'Input Aspect Ratio (H/W)': params.aspectRatio,
          'Input Vegetation (FVC)': `${(params.vegetationFraction * 100).toFixed(0)}%`,
          'Oke Max Delta T': `+${result.okeMaxDeltaT} °C`,
          'Evaluated UHI Anomaly (ΔT)': `+${result.deltaTUHI} °C`,
          'Calculated Urban Temp': `${result.urbanTemp} °C`
        }}
        explanation="This module evaluates the empirical contribution of each urban design factor to compute the net microclimate temperature elevation."
      />
    </div>
  );
};
