import React, { useState } from 'react';
import { FormulaCard } from './FormulaCard';
import { CodeModuleViewer } from './CodeModuleViewer';
import { LaTeXText } from './MathFormula';
import { EnergyBalanceParams } from '../types';
import { calculateEnergyBalance } from '../lib/thermalMath';
import { Sliders, PieChart as PieChartIcon, Droplets, Flame, HardDrive } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Lab3Props {
  onAskAI: (prompt: string) => void;
}

export const Lab3EnergyBalance: React.FC<Lab3Props> = ({ onAskAI }) => {
  const [params, setParams] = useState<EnergyBalanceParams>({
    netRadiation: 550, // W/m^2
    anthropogenicHeat: 40, // W/m^2
    vegetationFraction: 0.15, // 15% FVC
    aerodynamicResistance: 50,
    soilMoistureFraction: 0.35,
    surfaceTemp: 38.0,
    airTemp: 28.0
  });

  const result = calculateEnergyBalance(params);

  const fluxPieData = [
    { name: 'Sensible Heat (H)', value: Math.max(0, result.sensibleHeat), color: '#ef4444' },
    { name: 'Latent Heat (LE)', value: Math.max(0, result.latentHeat), color: '#10b981' },
    { name: 'Ground Heat Storage (G)', value: Math.max(0, result.groundStorageHeat), color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          <span>Step 3 of 6</span>
          <span>•</span>
          <span>Surface Energy Balance (SEB)</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Lab 3: Energy Flux Partitioning & Bowen Ratio ($\beta$)</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          <LaTeXText text="Conservation of energy at the urban land interface demands that total input energy ($R_n + Q_F$) must be partitioned into Sensible Heat ($H$, direct air heating), Latent Heat ($LE$, evaporative cooling), and Ground Heat Storage ($G$, mass heat storage)." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>SEB Flux Controls</span>
            </h3>
            <button
              onClick={() => setParams({
                netRadiation: 550,
                anthropogenicHeat: 40,
                vegetationFraction: 0.15,
                aerodynamicResistance: 50,
                soilMoistureFraction: 0.35,
                surfaceTemp: 38.0,
                airTemp: 28.0
              })}
              className="text-xs text-slate-400 hover:text-amber-400 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Net Radiation Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Net Solar & Sky Radiation (R_n)</span>
              <span className="font-mono text-amber-400 font-bold">{params.netRadiation} W/m²</span>
            </div>
            <input
              type="range"
              min="100"
              max="850"
              step="25"
              value={params.netRadiation}
              onChange={e => setParams({ ...params, netRadiation: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Anthropogenic Waste Heat Q_F */}
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
          </div>

          {/* Vegetation Cover FVC */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Vegetation Fraction (FVC)</span>
              <span className="font-mono text-emerald-400 font-bold">{(params.vegetationFraction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.85"
              step="0.05"
              value={params.vegetationFraction}
              onChange={e => setParams({ ...params, vegetationFraction: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Soil Moisture Fraction */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Soil & Root Moisture Availability</span>
              <span className="font-mono text-cyan-400 font-bold">{(params.soilMoistureFraction * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={params.soilMoistureFraction}
              onChange={e => setParams({ ...params, soilMoistureFraction: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Results & Pie Breakdown */}
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px] flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-red-400" /> Sensible (H)
              </span>
              <span className="text-lg font-bold font-mono text-red-400">{result.sensibleHeat} W/m²</span>
              <span className="text-[10px] text-slate-500 block">Heats Ambient Air</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px] flex items-center justify-center gap-1">
                <Droplets className="w-3 h-3 text-emerald-400" /> Latent (LE)
              </span>
              <span className="text-lg font-bold font-mono text-emerald-400">{result.latentHeat} W/m²</span>
              <span className="text-[10px] text-slate-500 block">{result.evapotranspirationRate} mm/day</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px] flex items-center justify-center gap-1">
                <HardDrive className="w-3 h-3 text-amber-400" /> Ground (G)
              </span>
              <span className="text-lg font-bold font-mono text-amber-400">{result.groundStorageHeat} W/m²</span>
              <span className="text-[10px] text-slate-500 block">Building Storage</span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 bg-amber-500/5 p-3 rounded-xl">
              <span className="text-amber-400 font-semibold uppercase tracking-wider block text-[10px]">Bowen Ratio (β)</span>
              <span className="text-xl font-extrabold font-mono text-amber-300">
                {result.bowenRatio > 50 ? '∞' : result.bowenRatio}
              </span>
              <span className="text-[10px] text-amber-400/80 block">H / LE</span>
            </div>
          </div>

          {/* Energy Flux Pie Chart */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <PieChartIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>SEB Energy Partitioning Ratio (Total Input: {result.totalInputEnergy} W/m²)</span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fluxPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {fluxPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} formatter={(val: any) => [`${val} W/m²`, 'Flux']} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Card */}
      <FormulaCard
        title="Surface Energy Balance & Bowen Ratio Equation"
        formula="R_n + Q_F = H + LE + G \quad \text{where} \quad \beta = \frac{H}{LE}"
        description="Sensible heat flux $H$ warms the air layer directly. Latent heat $LE$ cools the surface via evapotranspiration. High Bowen ratio $\beta$ ($> 2$) characterizes concrete urban deserts, whereas vegetated areas maintain $\beta < 0.5$."
        variables={[
          { symbol: 'R_n', name: 'Net Radiation', unit: 'W/m²', description: 'Net radiative budget' },
          { symbol: 'Q_F', name: 'Anthropogenic Heat', unit: 'W/m²', description: 'Human activity waste heat' },
          { symbol: 'H', name: 'Sensible Heat', unit: 'W/m²', description: 'Direct thermal energy transfer to air' },
          { symbol: 'LE', name: 'Latent Heat', unit: 'W/m²', description: 'Evapotranspirative phase change cooling' },
          { symbol: 'G', name: 'Ground Heat Storage', unit: 'W/m²', description: 'Conductive storage into urban pavement mass' },
          { symbol: '\\beta', name: 'Bowen Ratio', unit: 'ratio', description: 'Ratio of sensible to latent heat flux' }
        ]}
        physicalIntuition="Replacing natural soil and trees with concrete forces energy that would otherwise drive plant transpiration into sensible heat $H$, directly raising urban air temperatures."
        onAskAI={onAskAI}
      />

      {/* Code Viewer */}
      <CodeModuleViewer
        title="Executable TypeScript Code Module: Surface Energy Balance"
        stepNumber={3}
        codeSnippet={`function calculateEnergyBalance(params: EnergyBalanceParams): EnergyBalanceResult {
  const totalInput = params.netRadiation + params.anthropogenicHeat;
  
  const LE = totalInput * (0.65 * params.vegetationFraction * params.soilMoistureFraction);
  const G = totalInput * (0.35 - 0.25 * params.vegetationFraction);
  const H = totalInput - LE - G;
  const bowenRatio = LE > 0.5 ? H / LE : 99.9;

  return { totalInput, sensibleHeat: H, latentHeat: LE, groundStorageHeat: G, bowenRatio };
}`}
        calculatedValues={{
          'Total Input Energy (R_n + Q_F)': `${result.totalInputEnergy} W/m²`,
          'Sensible Air Heating (H)': `${result.sensibleHeat} W/m²`,
          'Latent Cooling (LE)': `${result.latentHeat} W/m²`,
          'Ground Mass Storage (G)': `${result.groundStorageHeat} W/m²`,
          'Bowen Ratio (β)': result.bowenRatio > 50 ? '∞ (Urban Desert)' : result.bowenRatio
        }}
        explanation="Evaluates how energy is split between direct air heating, water evaporation, and building storage based on urban surface cover."
      />
    </div>
  );
};
