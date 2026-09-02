import React, { useState } from 'react';
import { FormulaCard } from './FormulaCard';
import { CodeModuleViewer } from './CodeModuleViewer';
import { LaTeXText } from './MathFormula';
import { CanyonParams } from '../types';
import { calculateUrbanCanyon } from '../lib/thermalMath';
import { Sliders, Eye, Sun, Layers, Compass } from 'lucide-react';

interface Lab5Props {
  onAskAI: (prompt: string) => void;
}

export const Lab5UrbanCanyon: React.FC<Lab5Props> = ({ onAskAI }) => {
  const [params, setParams] = useState<CanyonParams>({
    buildingHeight: 30, // 30 meters
    streetWidth: 20, // 20 meters
    surfaceTemp: 36.0,
    wallEmissivity: 0.90,
    roadEmissivity: 0.93,
    solarElevationAngle: 45 // 45 degrees
  });

  const result = calculateUrbanCanyon(params);

  // SVG dimensions & scaling for 2D Canyon drawing
  const svgWidth = 400;
  const svgHeight = 240;

  // Scale canyon to fit SVG box
  const maxDim = Math.max(params.buildingHeight * 1.4, params.streetWidth * 1.4, 20);
  const scale = 140 / maxDim;

  const hPx = params.buildingHeight * scale;
  const wPx = params.streetWidth * scale;

  const leftBuildingX = (svgWidth - wPx) / 2 - 60;
  const rightBuildingX = (svgWidth + wPx) / 2;
  const streetY = svgHeight - 40;
  const buildingTopY = streetY - hPx;

  // Midpoint of street floor
  const streetMidX = svgWidth / 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          <span>Step 5 of 6</span>
          <span>•</span>
          <span>Urban Canyon & Sky View Factor</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">Lab 5: Canyon Geometry, Sky View Factor (SVF) & Trapping</h2>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          <LaTeXText text="Urban street canyons ($H/W$) restrict ground visibility to the open night sky, reducing the Sky View Factor ($\text{SVF} \in [0, 1]$) and trapping upwelling thermal longwave radiation inside vertical walls." />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Canyon Dimensions</span>
            </h3>
            <button
              onClick={() => setParams({
                buildingHeight: 30,
                streetWidth: 20,
                surfaceTemp: 36.0,
                wallEmissivity: 0.90,
                roadEmissivity: 0.93,
                solarElevationAngle: 45
              })}
              className="text-xs text-slate-400 hover:text-amber-400 cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Building Height H */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Building Height (H)</span>
              <span className="font-mono text-amber-400 font-bold">{params.buildingHeight} m</span>
            </div>
            <input
              type="range"
              min="5"
              max="100"
              step="5"
              value={params.buildingHeight}
              onChange={e => setParams({ ...params, buildingHeight: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Street Width W */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Street Width (W)</span>
              <span className="font-mono text-cyan-400 font-bold">{params.streetWidth} m</span>
            </div>
            <input
              type="range"
              min="8"
              max="80"
              step="2"
              value={params.streetWidth}
              onChange={e => setParams({ ...params, streetWidth: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Solar Elevation Angle */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Solar Elevation Angle (Sun Ray)</span>
              <span className="font-mono text-amber-300 font-bold">{params.solarElevationAngle}°</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={params.solarElevationAngle}
              onChange={e => setParams({ ...params, solarElevationAngle: parseFloat(e.target.value) })}
              className="w-full accent-amber-300 cursor-pointer"
            />
          </div>
        </div>

        {/* Interactive 2D Canyon Cross Section Visualizer */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Interactive 2D Urban Canyon SVG Cross-Section</span>
            </h3>
            <span className="text-xs font-mono font-bold text-amber-400">
              SVF = {result.skyViewFactor} (Trapping: {(result.radiationTrappingFactor * 100).toFixed(1)}%)
            </span>
          </div>

          {/* SVG Diagram */}
          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center overflow-hidden">
            <svg width={svgWidth} height={svgHeight} className="overflow-visible">
              {/* Sky Background */}
              <rect x="0" y="0" width={svgWidth} height={svgHeight} fill="#030712" rx="8" />

              {/* Sky View Cone Polygon */}
              <polygon
                points={`${streetMidX},${streetY} ${leftBuildingX + 60},${buildingTopY} ${rightBuildingX},${buildingTopY}`}
                fill="rgba(245, 158, 11, 0.12)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* Left Building */}
              <rect
                x={leftBuildingX}
                y={buildingTopY}
                width="60"
                height={hPx}
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="2"
              />
              <text x={leftBuildingX + 30} y={buildingTopY + hPx / 2} fill="#94a3b8" fontSize="11" textAnchor="middle">
                H={params.buildingHeight}m
              </text>

              {/* Right Building */}
              <rect
                x={rightBuildingX}
                y={buildingTopY}
                width="60"
                height={hPx}
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="2"
              />
              <text x={rightBuildingX + 30} y={buildingTopY + hPx / 2} fill="#94a3b8" fontSize="11" textAnchor="middle">
                H={params.buildingHeight}m
              </text>

              {/* Street Road Floor */}
              <rect
                x={leftBuildingX + 60}
                y={streetY}
                width={wPx}
                height="15"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="1"
              />
              <text x={streetMidX} y={streetY + 12} fill="#cbd5e1" fontSize="10" textAnchor="middle" fontWeight="bold">
                W = {params.streetWidth}m
              </text>

              {/* Trapped Longwave Reflection Vectors */}
              <path
                d={`M ${streetMidX - 15} ${streetY} L ${rightBuildingX} ${buildingTopY + hPx / 2} L ${streetMidX + 10} ${streetY}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={rightBuildingX} cy={buildingTopY + hPx / 2} r="3" fill="#ef4444" />

              {/* SVF Angle Label */}
              <text x={streetMidX} y={buildingTopY - 10} fill="#f59e0b" fontSize="12" textAnchor="middle" fontWeight="bold">
                Open Sky View Cone (SVF = {result.skyViewFactor})
              </text>
            </svg>
          </div>

          {/* Canyon Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Aspect Ratio (H/W)</span>
              <span className="font-mono font-bold text-amber-400 text-sm">{result.aspectRatio}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Sky View Factor</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{result.skyViewFactor}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Radiation Trapped</span>
              <span className="font-mono font-bold text-purple-400 text-sm">{result.trappedLongwaveFlux} W/m²</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Floor Shading</span>
              <span className="font-mono font-bold text-cyan-400 text-sm">{(result.shadingFraction * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Card */}
      <FormulaCard
        title="Sky View Factor (SVF) & Radiation Trapping"
        formula="\text{SVF} = \cos\left( \arctan\left( \frac{2H}{W} \right) \right), \quad L_{\text{trapped}} = (1 - \text{SVF}) \cdot L_{\uparrow}"
        description="The Sky View Factor quantifies the proportion of open sky visible from the center of an urban canyon floor. Deep canyons (high $H/W$) trap emitted surface longwave heat, slowing nocturnal cooling."
        variables={[
          { symbol: '\\text{SVF}', name: 'Sky View Factor', unit: '0..1', description: 'Fraction of unblocked hemisphere visible to sky' },
          { symbol: 'H', name: 'Building Height', unit: 'm', description: 'Average vertical street wall height' },
          { symbol: 'W', name: 'Street Width', unit: 'm', description: 'Distance between opposing canyon walls' },
          { symbol: 'L_{\\text{trapped}}', name: 'Trapped Longwave', unit: 'W/m²', description: 'Emitted radiation reflected back by canyon walls' }
        ]}
        physicalIntuition="In a flat rural field, $\text{SVF} = 1.0$, allowing all ground thermal radiation to escape cleanly into space. In a narrow street canyon ($H/W = 2.0$), $\text{SVF}$ drops to ~0.24, trapping over 75% of night thermal radiation!"
        onAskAI={onAskAI}
      />

      {/* Code Viewer */}
      <CodeModuleViewer
        title="Executable TypeScript Code Module: Urban Canyon Geometry"
        stepNumber={5}
        codeSnippet={`function calculateUrbanCanyon(H: number, W: number, T_surf: number): CanyonResult {
  const aspectRatio = H / W;
  const theta = Math.atan((2 * H) / W);
  const SVF = Math.cos(theta); // Sky View Factor
  
  const trappedRatio = 1 - SVF;
  const L_up = 0.93 * 5.67e-8 * Math.pow(T_surf + 273.15, 4);
  const trappedLongwaveFlux = trappedRatio * L_up;

  return { aspectRatio, skyViewFactor: Number(SVF.toFixed(3)), trappedLongwaveFlux };
}`}
        calculatedValues={{
          'Building Height (H)': `${params.buildingHeight} m`,
          'Street Width (W)': `${params.streetWidth} m`,
          'Aspect Ratio (H/W)': result.aspectRatio,
          'Sky View Factor (SVF)': result.skyViewFactor,
          'Trapped Heat Flux': `${result.trappedLongwaveFlux} W/m²`
        }}
        explanation="Computes the solid angle view factor to open sky and quantifies longwave radiation trapping within building canyons."
      />
    </div>
  );
};
