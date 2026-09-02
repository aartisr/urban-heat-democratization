import React, { useState } from 'react';
import { FormulaCard } from './FormulaCard';
import { CodeModuleViewer } from './CodeModuleViewer';
import { LaTeXText } from './MathFormula';
import { RadiationParams } from '../types';
import { calculateRadiationBudget, MATERIAL_PRESETS } from '../lib/thermalMath';
import { Sun, Moon, Sliders, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Lab2Props {
  onAskAI: (prompt: string) => void;
}

export const Lab2Radiation: React.FC<Lab2Props> = ({ onAskAI }) => {
  const [params, setParams] = useState<RadiationParams>({
    timeOfDay: 13, // 1:00 PM
    solarInsolationMax: 950, // W/m^2
    albedo: 0.10, // Asphalt
    emissivity: 0.93,
    ambientAirTemp: 28.0,
    surfaceTemp: 44.0,
    atmosphericEmissivity: 0.78
  });

  const [selectedMaterial, setSelectedMaterial] = useState<string>('asphalt');

  const handleSelectMaterial = (key: string) => {
    const mat = MATERIAL_PRESETS[key];
    if (mat) {
      setSelectedMaterial(key);
      setParams(prev => ({
        ...prev,
        albedo: mat.albedo,
        emissivity: mat.emissivity
      }));
    }
  };

  const result = calculateRadiationBudget(params);

  // Generate 24h curve for selected parameters
  const diurnalData = Array.from({ length: 25 }, (_, hour) => {
    const rad = calculateRadiationBudget({ ...params, timeOfDay: hour });
    return {
      hour: `${hour.toString().padStart(2, '0')}:00`,
      K_down: rad.shortwaveDown,
      K_net: rad.shortwaveNet,
      L_net: rad.longwaveNet,
      R_n: rad.netRadiation
    };
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          <span>Step 2 of 6</span>
          <span>•</span>
          <span>Radiation Budget & Spectral Flux</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Lab 2: Net Radiation ($R_n$) & Diurnal Energy Budget</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          <LaTeXText text="Net Radiation ($R_n$) is the primary fundamental driver of urban thermodynamics. It sums incoming shortwave solar radiation ($K_{\downarrow}$), reflected shortwave solar ($K_{\uparrow}$), downwelling longwave sky radiation ($L_{\downarrow}$), and upwelling surface thermal radiation ($L_{\uparrow}$)." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Radiation Parameters</span>
            </h3>
            <span className="text-xs text-amber-400 font-mono font-bold flex items-center gap-1">
              {params.timeOfDay >= 6 && params.timeOfDay <= 18 ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
              <span>{params.timeOfDay.toString().padStart(2, '0')}:00</span>
            </span>
          </div>

          {/* Time of Day Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Time of Day (Diurnal Hour)</span>
              <span className="font-mono text-amber-400 font-bold">{params.timeOfDay}:00</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="1"
              value={params.timeOfDay}
              onChange={e => setParams({ ...params, timeOfDay: parseInt(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>00:00 (Midnight)</span>
              <span>12:00 (Solar Noon)</span>
              <span>24:00 (Midnight)</span>
            </div>
          </div>

          {/* Material Presets */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Material Surface Preset</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
              {Object.entries(MATERIAL_PRESETS).map(([key, mat]) => (
                <button
                  key={key}
                  onClick={() => handleSelectMaterial(key)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedMaterial === key
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">{mat.name.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-400 font-mono">α = {mat.albedo}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Albedo Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Surface Albedo (α)</span>
              <span className="font-mono text-amber-400 font-bold">{params.albedo}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.85"
              step="0.01"
              value={params.albedo}
              onChange={e => {
                setSelectedMaterial('custom');
                setParams({ ...params, albedo: parseFloat(e.target.value) });
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Emissivity Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Surface Emissivity (ε_s)</span>
              <span className="font-mono text-purple-400 font-bold">{params.emissivity}</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="0.98"
              step="0.01"
              value={params.emissivity}
              onChange={e => setParams({ ...params, emissivity: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Surface & Air Temperatures */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Surface Temp (T_s)</span>
              <input
                type="number"
                value={params.surfaceTemp}
                onChange={e => setParams({ ...params, surfaceTemp: parseFloat(e.target.value) || 20 })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-sm font-mono text-amber-400"
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-slate-400">Air Temp (T_a)</span>
              <input
                type="number"
                value={params.ambientAirTemp}
                onChange={e => setParams({ ...params, ambientAirTemp: parseFloat(e.target.value) || 20 })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-sm font-mono text-cyan-400"
              />
            </div>
          </div>
        </div>

        {/* Live Flux Cards & Chart */}
        <div className="lg:col-span-7 space-y-5">
          {/* Flux Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Solar Down (K_dn)</span>
              <span className="text-lg font-bold font-mono text-amber-400">{result.shortwaveDown} W/m²</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Net Shortwave (K_net)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{result.shortwaveNet} W/m²</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Net Longwave (L_net)</span>
              <span className="text-lg font-bold font-mono text-purple-400">{result.longwaveNet} W/m²</span>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 bg-amber-500/5 p-3 rounded-xl">
              <span className="text-amber-400 font-semibold uppercase tracking-wider block text-[10px]">Net Radiation (R_n)</span>
              <span className="text-xl font-extrabold font-mono text-amber-300">{result.netRadiation} W/m²</span>
            </div>
          </div>

          {/* Diurnal Radiation Curve Chart */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>24-Hour Diurnal Radiation Fluxes (W/m²)</span>
            </h4>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={diurnalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Area type="monotone" dataKey="K_down" name="Solar K_down" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="K_net" name="Net Solar K_net" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="R_n" name="Net Radiation R_n" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Equations */}
      <FormulaCard
        title="Net Radiation Equation ($R_n$)"
        formula="R_n = K_{\text{net}} + L_{\text{net}} = K_{\downarrow}(1 - \alpha) + \varepsilon_s \sigma T_{\text{atm}}^4 - \varepsilon_s \sigma T_s^4"
        description="Net radiation sums incoming solar shortwave absorption and net atmospheric thermal longwave exchange. High albedo $\alpha$ reflects incoming solar energy, directly lowering $R_n$."
        variables={[
          { symbol: 'R_n', name: 'Net Radiation', unit: 'W/m²', description: 'Total net energy flux entering surface' },
          { symbol: 'K_{\\downarrow}', name: 'Incoming Solar', unit: 'W/m²', description: 'Direct + diffuse shortwave solar radiation' },
          { symbol: '\\alpha', name: 'Albedo', unit: '0..1', description: 'Fraction of solar shortwave reflected' },
          { symbol: 'L_{\\downarrow}', name: 'Sky Longwave', unit: 'W/m²', description: 'Thermal infrared emitted by atmosphere' },
          { symbol: 'L_{\\uparrow}', name: 'Surface Longwave', unit: 'W/m²', description: 'Thermal infrared re-radiated by ground' },
          { symbol: '\\varepsilon_s', name: 'Emissivity', unit: '0..1', description: 'Surface thermal radiative efficiency' }
        ]}
        physicalIntuition="At night, $K_{\\downarrow}$ is zero, making $R_n$ negative (cooling to space). During peak noon, $R_n$ can reach 600-800 W/m² depending on material albedo."
        onAskAI={onAskAI}
      />

      {/* Code Viewer */}
      <CodeModuleViewer
        title="Executable TypeScript Code Module: Radiation Budget"
        stepNumber={2}
        codeSnippet={`function calculateRadiationBudget(params: RadiationParams): RadiationResult {
  const shortwaveDown = params.solarInsolationMax * Math.max(0, Math.cos(((params.timeOfDay - 12) * Math.PI) / 12));
  const shortwaveReflected = shortwaveDown * params.albedo;
  const shortwaveNet = shortwaveDown - shortwaveReflected;

  const T_air_K = params.ambientAirTemp + 273.15;
  const T_surf_K = params.surfaceTemp + 273.15;

  const longwaveDown = 0.78 * 5.67e-8 * Math.pow(T_air_K, 4);
  const longwaveUp = params.emissivity * 5.67e-8 * Math.pow(T_surf_K, 4);
  const longwaveNet = longwaveDown - longwaveUp;

  const netRadiation = shortwaveNet + longwaveNet;
  return { shortwaveDown, shortwaveNet, longwaveNet, netRadiation };
}`}
        calculatedValues={{
          'Time of Day': `${params.timeOfDay}:00`,
          'Material Albedo (α)': params.albedo,
          'Solar Insolation (K_down)': `${result.shortwaveDown} W/m²`,
          'Reflected Solar (K_up)': `${result.shortwaveReflected} W/m²`,
          'Net Radiation (R_n)': `${result.netRadiation} W/m²`
        }}
        explanation="Calculates solar reflection and thermal infrared emission to establish net radiative energy available at the urban surface."
      />
    </div>
  );
};
