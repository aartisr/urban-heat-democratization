import React, { useState } from 'react';
import { FormulaCard } from './FormulaCard';
import { CodeModuleViewer } from './CodeModuleViewer';
import { LaTeXText } from './MathFormula';
import { GraphNodeToyExample } from './GraphNodeToyExample';
import { LandCoverType, GridCell } from '../types';
import { createDefaultCityGrid, solveGMRFTemperatureField, LAND_COVER_CONFIGS } from '../lib/gmrfGraph';
import { Sliders, Grid, Sparkles, RefreshCw, Layers, ShieldCheck, Network, LayoutGrid } from 'lucide-react';

interface Lab6Props {
  onAskAI: (prompt: string) => void;
}

export const Lab6GMRFGraph: React.FC<Lab6Props> = ({ onAskAI }) => {
  const [labMode, setLabMode] = useState<'8x8-grid' | '4node-toy'>('4node-toy');
  const [grid, setGrid] = useState<GridCell[][]>(() => createDefaultCityGrid(8, 8));
  const [activeBrush, setActiveBrush] = useState<LandCoverType>('tree');
  const [smoothingWeight, setSmoothingWeight] = useState<number>(0.35);

  const gmrfResult = solveGMRFTemperatureField(grid, smoothingWeight);

  const handleCellClick = (r: number, c: number) => {
    const newGrid = grid.map((row, ri) =>
      row.map((cell, ci) => {
        if (ri === r && ci === c) {
          const cfg = LAND_COVER_CONFIGS[activeBrush];
          return {
            ...cell,
            landCover: activeBrush,
            albedo: cfg.albedo,
            vegetationDensity: cfg.vegDensity,
            anthropogenicHeat: cfg.qf,
            baselineTemp: cfg.baseTemp
          };
        }
        return cell;
      })
    );
    setGrid(newGrid);
  };

  const handleResetGrid = () => {
    setGrid(createDefaultCityGrid(8, 8));
  };

  // Color mapper for inferred cell temperatures
  const getTempColorClass = (temp: number) => {
    if (temp >= 38) return 'bg-red-600 text-white border-red-400';
    if (temp >= 35) return 'bg-orange-500 text-white border-orange-300';
    if (temp >= 32) return 'bg-amber-500 text-slate-900 border-amber-300';
    if (temp >= 28) return 'bg-yellow-400 text-slate-900 border-yellow-200';
    if (temp >= 26) return 'bg-emerald-500 text-white border-emerald-300';
    return 'bg-cyan-600 text-white border-cyan-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          <span>Step 6 of 6</span>
          <span>•</span>
          <span>Spectral Urbanism GMRF Model</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Lab 6: Gaussian Markov Random Field (GMRF) & Thermal Graph</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          <LaTeXText text="Spectral Urbanism abstracts city layouts into a spatial stochastic graph $\mathbf{T} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{Q}^{-1})$. Using the graph Laplacian precision matrix $\mathbf{Q} = \tau(\mathbf{I} + \kappa^2 \mathbf{L})$, thermal field inferences propagate across neighborhood cells." />
        </p>
      </div>

      {/* Mode Switcher Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Lab View Mode:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setLabMode('4node-toy')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                labMode === '4node-toy'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Step-by-Step 4-Node Toy Graph Example</span>
            </button>
            <button
              onClick={() => setLabMode('8x8-grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                labMode === '8x8-grid'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Full 8x8 City Grid GMRF Canvas</span>
            </button>
          </div>
        </div>
      </div>

      {labMode === '4node-toy' ? (
        <GraphNodeToyExample onAskAI={onAskAI} />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Land Cover Brush Palette & Controls */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Grid className="w-4 h-4 text-amber-400" />
              <span>Intervention Brush Palette</span>
            </h3>
            <button
              onClick={handleResetGrid}
              className="text-xs text-slate-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset Grid
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Select Brush to Paint Grid Cells:</label>
            <div className="space-y-1.5">
              {(Object.keys(LAND_COVER_CONFIGS) as LandCoverType[]).map(type => {
                const cfg = LAND_COVER_CONFIGS[type];
                return (
                  <button
                    key={type}
                    onClick={() => setActiveBrush(type)}
                    className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      activeBrush === type
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-base">{cfg.icon}</span>
                      <span>{cfg.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{cfg.baseTemp} °C</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spatial Diffusion Weight Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">GMRF Spatial Coupling (α)</span>
              <span className="font-mono text-amber-400 font-bold">{smoothingWeight}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.05"
              value={smoothingWeight}
              onChange={e => setSmoothingWeight(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.05 (Isolated Cells)</span>
              <span>0.35 (Standard City)</span>
              <span>0.80 (High Diffusion)</span>
            </div>
          </div>
        </div>

        {/* Interactive 8x8 Grid Canvas & GMRF Metrics */}
        <div className="lg:col-span-8 space-y-4">
          {/* Metrics Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Avg City Temp</span>
              <span className="text-lg font-bold font-mono text-amber-400">{gmrfResult.avgTemp} °C</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Max Hotspot</span>
              <span className="text-lg font-bold font-mono text-red-400">{gmrfResult.maxTemp} °C</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Thermal Disparity (ΔT)</span>
              <span className="text-lg font-bold font-mono text-purple-400">{gmrfResult.thermalDisparity} °C</span>
            </div>
            <div className="bg-slate-900 border border-amber-500/30 bg-amber-500/5 p-3 rounded-xl">
              <span className="text-amber-400 font-semibold block text-[10px]">Spectral Resilience (λ2)</span>
              <span className="text-lg font-extrabold font-mono text-amber-300">{gmrfResult.spectralResilience}</span>
            </div>
          </div>

          {/* Grid View */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Interactive Spatial GMRF Inferred Thermal Map (Click cell to edit)</span>
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Active Brush: {LAND_COVER_CONFIGS[activeBrush].name}</span>
            </div>

            <div className="grid grid-cols-8 gap-1.5 max-w-md mx-auto aspect-square p-2 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
              {gmrfResult.grid.map((row, r) =>
                row.map((cell, c) => {
                  const cfg = LAND_COVER_CONFIGS[cell.landCover];
                  return (
                    <button
                      key={`${r}_${c}`}
                      onClick={() => handleCellClick(r, c)}
                      className={`relative flex flex-col items-center justify-center rounded-lg border transition-all cursor-pointer hover:scale-105 shadow ${getTempColorClass(cell.inferredTemp)}`}
                      title={`${cfg.name}: Inferred ${cell.inferredTemp}°C`}
                    >
                      <span className="text-xs sm:text-base leading-none">{cfg.icon}</span>
                      <span className="text-[9px] font-mono font-bold mt-0.5 leading-tight">
                        {cell.inferredTemp}°
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-600 inline-block"></span> &lt; 28°C
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span> 28-32°C
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> 32-35°C
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-red-600 inline-block"></span> &gt; 38°C
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Card */}
      <FormulaCard
        title="GMRF Precision Matrix & Spectral Resilience"
        formula="\mathbf{T} \sim \mathcal{N}(\boldsymbol{\mu}, \mathbf{Q}^{-1}), \quad \mathbf{Q} = \tau \left( \mathbf{I} + \kappa^2 \mathbf{L} \right)"
        description="The spatial precision matrix $\mathbf{Q}$ models Gaussian Markov Random Fields using graph Laplacian $\mathbf{L}$. It captures how microclimate greening interventions spread thermal cooling across adjacent neighborhoods."
        variables={[
          { symbol: '\\mathbf{T}', name: 'Temperature Vector', unit: '°C', description: 'Spatial field of cell microclimate temps' },
          { symbol: '\\mathbf{Q}', name: 'Precision Matrix', unit: 'matrix', description: 'Inverse covariance matrix capturing spatial conditional dependencies' },
          { symbol: '\\mathbf{L}', name: 'Graph Laplacian', unit: 'matrix', description: 'Discrete graph Laplacian operator representing spatial adjacency' },
          { symbol: '\\lambda_2', name: 'Algebraic Connectivity', unit: 'scalar', description: 'Spectral graph metric measuring thermal resilience' }
        ]}
        physicalIntuition="By painting tree canopies or cool roofs on the grid, you observe how neighbor cell temperatures cool down automatically through spatial GMRF diffusion."
        onAskAI={onAskAI}
      />

      {/* Code Viewer */}
      <CodeModuleViewer
        title="Executable TypeScript Code Module: GMRF Graph Solver"
        stepNumber={6}
        codeSnippet={`function solveGMRFTemperatureField(grid: GridCell[][], alpha: number): GMRFResult {
  // Solves (I + alpha * L) T = T_base via Gauss-Seidel iterations
  for (let iter = 0; iter < 25; iter++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const neighborMean = get4NeighborTempMean(r, c);
        T[r][c] = (1 - alpha) * T_base[r][c] + alpha * neighborMean;
      }
    }
  }
  return { avgTemp, maxTemp, minTemp, spectralResilience };
}`}
        calculatedValues={{
          'Grid Resolution': '8x8 cells (64 total)',
          'GMRF Coupling Factor (α)': smoothingWeight,
          'Average City Temp': `${gmrfResult.avgTemp} °C`,
          'Max Hotspot': `${gmrfResult.maxTemp} °C`,
          'Spectral Resilience (λ2)': gmrfResult.spectralResilience
        }}
        explanation="Propagates microclimate cooling across neighboring graph nodes using discrete spatial graph Laplacian operators."
      />
    </>
    )}
    </div>
  );
};
