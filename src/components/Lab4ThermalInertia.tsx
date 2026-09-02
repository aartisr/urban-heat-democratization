import React, { useState } from 'react';
import { FormulaCard } from './FormulaCard';
import { CodeModuleViewer } from './CodeModuleViewer';
import { LaTeXText } from './MathFormula';
import { MATERIAL_PRESETS, calculateThermalInertia, generate24hDiurnalSimulation } from '../lib/thermalMath';
import { Sliders, Activity, Clock, Flame, ShieldAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Lab4Props {
  onAskAI: (prompt: string) => void;
}

export const Lab4ThermalInertia: React.FC<Lab4Props> = ({ onAskAI }) => {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('asphalt');
  const [thickness, setThickness] = useState<number>(0.15); // 15 cm

  const mat = MATERIAL_PRESETS[selectedMaterial] || MATERIAL_PRESETS.asphalt;
  const result = calculateThermalInertia({
    material: mat,
    thickness,
    ambientAirTempDay: 32,
    ambientAirTempNight: 22,
    peakSolarInsolation: 950
  });

  const diurnalPoints = generate24hDiurnalSimulation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          <span>Step 4 of 6</span>
          <span>•</span>
          <span>Thermal Inertia & Nighttime Heat Retention</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Lab 4: Material Thermal Inertia ($P$) & Nighttime UHI Peak</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          <LaTeXText text="The nocturnal UHI peak occurs because high thermal inertia materials (like asphalt and dense concrete) absorb immense solar thermal energy during the daytime and re-radiate it slowly after sunset, maintaining high urban surface temperatures all night." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Material Thermal Properties</span>
            </h3>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Select Surface Material</label>
            <div className="space-y-1.5">
              {Object.entries(MATERIAL_PRESETS).map(([key, m]) => (
                <button
                  key={key}
                  onClick={() => setSelectedMaterial(key)}
                  className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                    selectedMaterial === key
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold">{m.name}</div>
                    <div className="text-[10px] text-slate-400">
                      ρ = {m.density} kg/m³ | k = {m.thermalConductivity} W/mK
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    α = {m.albedo}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Thickness Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Layer Thickness (d)</span>
              <span className="font-mono text-amber-400 font-bold">{(thickness * 100).toFixed(0)} cm</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.50"
              step="0.01"
              value={thickness}
              onChange={e => setThickness(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>2 cm (Thin Paint/Roof)</span>
              <span>15 cm (Road)</span>
              <span>50 cm (Massive Slab)</span>
            </div>
          </div>
        </div>

        {/* Results & 24h Nighttime Heat Chart */}
        <div className="lg:col-span-7 space-y-5">
          {/* Output Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Thermal Inertia (P)</span>
              <span className="text-lg font-bold font-mono text-amber-400">{result.thermalInertiaP}</span>
              <span className="text-[10px] text-slate-500 block">J/(m²·s^0.5·K)</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Heat Capacity (Cv)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">{(result.volumetricHeatCapacity / 1e6).toFixed(2)} MJ/m³K</span>
              <span className="text-[10px] text-slate-500 block">Mass Storage</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Thermal Phase Lag</span>
              <span className="text-lg font-bold font-mono text-purple-400 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {result.phaseLagHours} hrs
              </span>
              <span className="text-[10px] text-slate-500 block">Peak Peak Delay</span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 bg-amber-500/5 p-3 rounded-xl">
              <span className="text-amber-400 font-semibold uppercase tracking-wider block text-[10px]">Diurnal Range</span>
              <span className="text-xl font-extrabold font-mono text-amber-300">±{result.diurnalTempRange} °C</span>
              <span className="text-[10px] text-amber-400/80 block">Temp Amplitude</span>
            </div>
          </div>

          {/* 24h Temperature Comparison Graph */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>24-Hour Diurnal Temperature Curves (°C) & Nighttime Heat Gap</span>
            </h4>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={diurnalPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} formatter={val => `${val}:00`} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[15, 55]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="monotone" dataKey="airTemp" name="Ambient Air Temp" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="asphaltSurfaceTemp" name="Asphalt Surface (High Inertia)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="coolRoofSurfaceTemp" name="Cool Roof Surface" stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  <Line type="monotone" dataKey="vegetatedSurfaceTemp" name="Vegetated Park" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Card */}
      <FormulaCard
        title="Thermal Inertia & Heat Storage Equation"
        formula="P = \sqrt{k \cdot \rho \cdot c_p}, \quad \frac{\partial T_s}{\partial t} = \frac{R_n + Q_F - H - LE}{\rho c_p d}"
        description="Thermal Inertia $P$ measures a material's resistance to temperature changes. High $P$ materials store absorbed daytime radiation and re-radiate it slowly during the night."
        variables={[
          { symbol: 'P', name: 'Thermal Inertia', unit: 'J/(m²·s^0.5·K)', description: 'Thermal resistance & storage inertia' },
          { symbol: 'k', name: 'Thermal Conductivity', unit: 'W/(m·K)', description: 'Heat conduction rate' },
          { symbol: '\\rho', name: 'Density', unit: 'kg/m³', description: 'Material density' },
          { symbol: 'c_p', name: 'Specific Heat', unit: 'J/(kg·K)', description: 'Energy to raise 1kg by 1°C' },
          { symbol: 'd_e', name: 'Damping Depth', unit: 'm', description: 'Depth where diurnal heat wave attenuates' }
        ]}
        physicalIntuition="Notice on the 24-hour graph how asphalt surface temperature stays significantly warmer than air temperature between 20:00 and 04:00. This nighttime heat release is the signature characteristic of urban thermal inertia."
        onAskAI={onAskAI}
      />

      {/* Code Viewer */}
      <CodeModuleViewer
        title="Executable TypeScript Code Module: Thermal Inertia & Damping"
        stepNumber={4}
        codeSnippet={`function calculateThermalInertia(mat: MaterialThermalProps, thickness: number): ThermalInertiaResult {
  const Cv = mat.density * mat.specificHeat; // Volumetric Heat Capacity
  const P = Math.sqrt(mat.thermalConductivity * Cv); // Thermal Inertia
  
  const omega = (2 * Math.PI) / 86400; // 24h frequency
  const dampingDepth = Math.sqrt((2 * mat.thermalConductivity) / (omega * Cv));
  const phaseLagHours = Math.min(8, (thickness / dampingDepth) * 3.82);

  return { volumetricHeatCapacity: Cv, thermalInertiaP: P, dampingDepth, phaseLagHours };
}`}
        calculatedValues={{
          'Selected Material': mat.name,
          'Layer Thickness': `${(thickness * 100).toFixed(0)} cm`,
          'Thermal Inertia (P)': Math.round(result.thermalInertiaP),
          'Thermal Phase Lag': `${result.phaseLagHours} hours`,
          'Damping Depth (d_e)': `${result.dampingDepth} m`
        }}
        explanation="Calculates thermal storage capacity and time delay between solar absorption peak and nocturnal heat re-radiation."
      />
    </div>
  );
};
