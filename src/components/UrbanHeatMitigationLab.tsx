import React, { useState } from 'react';
import { 
  TreePine, 
  Sun, 
  Building, 
  Wind, 
  Thermometer, 
  ShieldAlert, 
  Sparkles, 
  RotateCcw,
  CheckCircle2,
  TrendingDown,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { SIMULATION_PRESETS } from '../data/evaluationData';

export const UrbanHeatMitigationLab: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('holistic_resilience');
  
  // Custom slider state
  const [treeCanopyPct, setTreeCanopyPct] = useState<number>(30);
  const [coolAlbedoPct, setCoolAlbedoPct] = useState<number>(60);
  const [shadeSqM, setShadeSqM] = useState<number>(2500);
  const [greenCorridors, setGreenCorridors] = useState<number>(4);

  const applyPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    const p = SIMULATION_PRESETS.find(item => item.id === presetId);
    if (p) {
      setTreeCanopyPct(p.canopyIncreasePct);
      setCoolAlbedoPct(p.coolRoofAlbedoPct);
      setShadeSqM(p.shadeStructuresSqM);
      setGreenCorridors(p.greenCorridorCount);
    }
  };

  // Thermodynamics calculation approximations based on urban microclimate models (Oke 1982, Santamouris 2014, Aarti Model)
  // Surface Temp Reduction (°C):
  // Tree canopy provides shading + evapotranspiration: ~0.14°C per 1% canopy
  // Cool roof albedo (jump above baseline 15%): ~0.07°C per 1% albedo increase
  // Shade structures: ~0.0006°C per sq meter of pedestrian shade
  // Green corridors: ~0.4°C per connected ecological corridor
  const albedoDelta = Math.max(0, coolAlbedoPct - 15);
  const surfaceReductionC = Number(
    (treeCanopyPct * 0.13 + albedoDelta * 0.065 + shadeSqM * 0.00055 + greenCorridors * 0.35).toFixed(1)
  );
  
  // Ambient Air Temp Reduction at 2-meter pedestrian height (°C):
  const ambientReductionC = Number(
    (surfaceReductionC * 0.42).toFixed(1)
  );

  // Fahrenheit equivalents
  const surfaceReductionF = Number((surfaceReductionC * 1.8).toFixed(1));
  const ambientReductionF = Number((ambientReductionC * 1.8).toFixed(1));

  // Baseline temperatures for a hot summer day in a dense urban hotspot
  const baselineSurfaceTempF = 126.0; // 52.2°C
  const baselineAirTempF = 94.0; // 34.4°C

  const resultingSurfaceTempF = (baselineSurfaceTempF - surfaceReductionF).toFixed(1);
  const resultingAirTempF = (baselineAirTempF - ambientReductionF).toFixed(1);

  // Equity Score calculation (1 to 10 scale)
  const equityScore = Math.min(10, Math.max(1, Number(
    (3.2 + (treeCanopyPct * 0.12) + (coolAlbedoPct * 0.04) + (shadeSqM * 0.0008) + (greenCorridors * 0.3)).toFixed(1)
  )));

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Thermometer className="w-5 h-5 text-amber-400" />
            <span>Interactive Urban Heat Mitigation Sandbox</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate the exact mitigation modeling capabilities of <strong>urban-heat.ai-aarti.com</strong> by adjusting canopy, albedo, and green corridors in a high-density neighborhood.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Evaluation Lab Score:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-sm">
            8.8 / 10.0
          </span>
        </div>
      </div>

      {/* Preset Scenario Tabs */}
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
          Load Scenario Preset (Modeled after Aarti S Ravikumar's Research Studies)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SIMULATION_PRESETS.map((preset) => {
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                id={`preset-${preset.id}`}
                className={`p-3.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/50'
                    : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-white mb-1">{preset.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{preset.notes}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{preset.costEfficiency}</span>
                  <span className="text-emerald-400 font-bold font-mono">-{preset.surfaceTempReductionC}°C</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls & Real-Time Impact Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Area (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Intervention Parameter Controls</span>
          </h3>

          {/* Slider 1: Tree Canopy */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <TreePine className="w-4 h-4 text-emerald-400" />
                <span>Urban Tree Canopy Increase</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                +{treeCanopyPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={treeCanopyPct}
              onChange={(e) => {
                setSelectedPreset('custom');
                setTreeCanopyPct(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              id="slider-canopy"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0% (Dense concrete)</span>
              <span>25% (Medium leafy)</span>
              <span>50% (Forest canopy)</span>
            </div>
          </div>

          {/* Slider 2: Cool Roofs & Pavements */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>High-Albedo Cool Surfaces (Reflectance)</span>
              </span>
              <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {coolAlbedoPct}% Albedo
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="85"
              step="5"
              value={coolAlbedoPct}
              onChange={(e) => {
                setSelectedPreset('custom');
                setCoolAlbedoPct(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              id="slider-albedo"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>15% (Dark asphalt)</span>
              <span>50% (Standard cool roof)</span>
              <span>85% (Ultra-white coating)</span>
            </div>
          </div>

          {/* Slider 3: Shade Structures */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-teal-400" />
                <span>Architectural Shade Sails & Canopies</span>
              </span>
              <span className="font-mono font-bold text-teal-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {shadeSqM.toLocaleString()} m²
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="250"
              value={shadeSqM}
              onChange={(e) => {
                setSelectedPreset('custom');
                setShadeSqM(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
              id="slider-shade"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 m²</span>
              <span>2,500 m² (Bus stops + plazas)</span>
              <span>5,000 m² (Civic network)</span>
            </div>
          </div>

          {/* Slider 4: Green Corridors */}
          <div className="space-y-1.5 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-emerald-400" />
                <span>Connected Ecological Green Corridors</span>
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {greenCorridors} Corridors
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={greenCorridors}
              onChange={(e) => {
                setSelectedPreset('custom');
                setGreenCorridors(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              id="slider-corridors"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0 (Fragmented)</span>
              <span>4 (Interconnected)</span>
              <span>8 (Continuous parkway)</span>
            </div>
          </div>
        </div>

        {/* Live Simulation Results & Thermal Deltas (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulated Microclimate Outcomes</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Aarti Model Engine
              </span>
            </div>

            {/* Temperature Metrics */}
            <div className="grid grid-cols-2 gap-4 my-4">
              {/* Surface Temp */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  Land Surface Temp (LST)
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-rose-400 font-mono">
                    {resultingSurfaceTempF}°F
                  </span>
                  <span className="text-[11px] text-slate-500 line-through">
                    {baselineSurfaceTempF}°F
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-xs">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-{surfaceReductionC}°C / -{surfaceReductionF}°F</span>
                </div>
              </div>

              {/* Ambient Air Temp */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 text-center">
                <span className="text-[11px] font-semibold text-slate-400 block uppercase">
                  2-Meter Pedestrian Air Temp
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black text-amber-300 font-mono">
                    {resultingAirTempF}°F
                  </span>
                  <span className="text-[11px] text-slate-500 line-through">
                    {baselineAirTempF}°F
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-xs">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>-{ambientReductionC}°C / -{ambientReductionF}°F</span>
                </div>
              </div>
            </div>

            {/* Equity Index Bar */}
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">Cooling Equity & Resilience Score:</span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {equityScore.toFixed(1)} / 10.0
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-teal-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${(equityScore / 10) * 100}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Reflects equitable heat mitigation access for elderly, transit riders, and redlined census tracts.
              </p>
            </div>
          </div>

          {/* Audit Verification Note */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Platform Audit Verification:</strong> The interactive lab at <a href="https://urban-heat.ai-aarti.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline font-mono">urban-heat.ai-aarti.com</a> executes these thermodynamic balances smoothly, earning an <strong>8.8 / 10</strong> for simulation usability.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
