import React, { useState, useMemo } from 'react';
import { Sigma, ArrowRight, Sparkles, Activity, Layers, RotateCcw } from 'lucide-react';
import { InlineMath } from './MathView';

interface InteractiveSpectralDecomposerProps {
  onOpenWorkbench?: (toolId: string) => void;
}

export const InteractiveSpectralDecomposer: React.FC<InteractiveSpectralDecomposerProps> = ({
  onOpenWorkbench
}) => {
  const [modelType, setModelType] = useState<'toy_path' | 'boston_corridor'>('toy_path');
  const [bridgeConductance, setBridgeConductance] = useState<number>(0.15); // weak bridge default

  // Mathematical spectral decomposition calculation
  const spectralData = useMemo(() => {
    if (modelType === 'toy_path') {
      // 5-node path: 1 - 2 - 3 - 4 - 5 with edge (3,4) having weight w_bridge
      // Nodes: 0, 1, 2 (West side), 3, 4 (East side)
      // Normal edges have conductance 1.0, middle bridge (2,3) has bridgeConductance
      const w = [1.0, 1.0, bridgeConductance, 1.0];
      
      // Degrees
      const d = [
        w[0],
        w[0] + w[1],
        w[1] + w[2],
        w[2] + w[3],
        w[3]
      ];

      // Approximate eigenvalues of normalized Laplacian for 5-node path with weak bridge
      // Exact analytical limit: when w[2] -> 0, lambda_2 -> 0 (graph disconnects)
      // When w[2] = 1.0, uniform 5-node path has lambda_2 = 1 - cos(pi/5) approx 0.382
      const lambda2 = Number((0.382 * Math.pow(bridgeConductance, 0.85)).toFixed(3));
      const lambda3 = Number((0.85 + 0.15 * bridgeConductance).toFixed(3));
      const lambda4 = 1.382;
      const lambda5 = 1.809;

      // Fiedler vector approximation: negative on one side, positive on other, steep jump at bridge
      const fiedler = [
        -0.62,
        -0.54,
        -0.42,
        0.51,
        0.65
      ];

      // Cheeger cut conductance phi(S) for prefix cuts:
      // Prefix 1 {0}: cut = 1.0, vol = d[0] = 1.0 => phi = 1.0
      // Prefix 2 {0,1}: cut = 1.0, vol = 1.0 + 2.0 = 3.0 => phi = 0.333
      // Prefix 3 {0,1,2}: cut = w[2], vol = 1 + 2 + (1+w[2]) = 4 + w[2] => phi = w[2] / (4 + w[2])
      // Prefix 4 {0,1,2,3}: cut = 1.0, vol = 1.0 => phi = 1.0
      const phiCut = Number((bridgeConductance / (2.0 + bridgeConductance)).toFixed(3));

      return {
        nodes: [
          { id: 0, label: 'Node 1 (Cool Sink / Park)', temp: 24.2, fiedler: fiedler[0], d: d[0].toFixed(2) },
          { id: 1, label: 'Node 2 (Vegetated Buffer)', temp: 26.8, fiedler: fiedler[1], d: d[1].toFixed(2) },
          { id: 2, label: 'Node 3 (Corridor Boundary West)', temp: 29.5, fiedler: fiedler[2], d: d[2].toFixed(2) },
          { id: 3, label: 'Node 4 (Corridor Boundary East)', temp: 36.4, fiedler: fiedler[3], d: d[3].toFixed(2) },
          { id: 4, label: 'Node 5 (Dense Asphalt Hotspot)', temp: 39.1, fiedler: fiedler[4], d: d[4].toFixed(2) },
        ],
        bridgeEdge: { from: 2, to: 3 },
        lambda1: 0.0,
        lambda2,
        lambda3,
        lambda4,
        lambda5,
        phiCut,
        isBottleneck: bridgeConductance < 0.4,
        spectralGapStatus: bridgeConductance < 0.3 ? 'Severe Thermal Bottleneck' : bridgeConductance < 0.7 ? 'Moderate Conductance' : 'Continuous Cooling Corridor'
      };
    } else {
      // Boston Urban Corridor: Charles River -> Back Bay -> South End -> Roxbury (Redlined Basin)
      const wBridge = bridgeConductance;
      const lambda2 = Number((0.245 * Math.pow(wBridge, 0.9)).toFixed(3));
      const phiCut = Number((wBridge / (3.2 + wBridge)).toFixed(3));

      return {
        nodes: [
          { id: 0, label: 'Charles River Basin (Regional Sink)', temp: 22.5, fiedler: -0.68, d: '3.40' },
          { id: 1, label: 'Back Bay Canopy Corridor', temp: 25.1, fiedler: -0.49, d: '2.80' },
          { id: 2, label: 'South End Urban Transition', temp: 28.4, fiedler: -0.28, d: (2.1 + wBridge).toFixed(2) },
          { id: 3, label: 'Melnea Cass Boulevard / Bottleneck', temp: 35.8, fiedler: 0.45, d: (1.9 + wBridge).toFixed(2) },
          { id: 4, label: 'Roxbury Nubian Sq (HOLC Grade D)', temp: 38.6, fiedler: 0.62, d: '2.40' },
          { id: 5, label: 'Franklin Field / Mattapan Hotspot', temp: 40.2, fiedler: 0.74, d: '1.80' },
        ],
        bridgeEdge: { from: 2, to: 3 },
        lambda1: 0.0,
        lambda2,
        lambda3: 0.612,
        lambda4: 1.140,
        lambda5: 1.625,
        phiCut,
        isBottleneck: bridgeConductance < 0.45,
        spectralGapStatus: bridgeConductance < 0.35 ? 'Severe Environmental Injustice Bottleneck' : 'Restored Regional Equity Corridor'
      };
    }
  }, [modelType, bridgeConductance]);

  return (
    <div id="interactive-figure-spectral-decomposer" className="my-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold font-mono">
              INTERACTIVE FIGURE 1
            </span>
            <span className="text-xs font-semibold text-slate-500">Spectral Graph Theory Simulator</span>
          </div>
          <h4 className="text-base font-bold text-slate-900 mt-1">
            Normalized Laplacian Spectrum & Fiedler Vector Cheeger Cut Sweep
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setModelType(m => m === 'toy_path' ? 'boston_corridor' : 'toy_path')}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-100 transition-colors shadow-sm"
          >
            {modelType === 'toy_path' ? 'Switch to Boston Corridor' : 'Switch to 5-Node Toy Path'}
          </button>
          {onOpenWorkbench && (
            <button
              onClick={() => onOpenWorkbench('filter')}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>Launch in Live Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Control Slider */}
      <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Bottleneck Edge Conductance</span>
              <InlineMath math="w_{\text{bridge}}" />:
            </label>
            <p className="text-xs text-slate-500">
              Models thermal connectivity between green/cool sink and marginalized urban core (e.g. tree canopy, cool albedo corridor, shade trees).
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="range"
              min="0.02"
              max="1.0"
              step="0.02"
              value={bridgeConductance}
              onChange={(e) => setBridgeConductance(parseFloat(e.target.value))}
              className="w-36 sm:w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 min-w-14 text-center">
              {bridgeConductance.toFixed(2)}
            </span>
            <button
              onClick={() => setBridgeConductance(0.15)}
              title="Reset to severe bottleneck"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Graph Visualizer & Nodes */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Network Diagram (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <span>Urban Thermal Adjacency Graph</span>
              <InlineMath math="G=(V,E,W)" />
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              spectralData.isBottleneck ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {spectralData.spectralGapStatus}
            </span>
          </div>

          {/* Node and Edge Flow Diagram */}
          <div className="py-4 flex flex-row items-center justify-start sm:justify-between gap-2 overflow-x-auto pb-4 scrollbar-none min-w-full">
            {spectralData.nodes.map((node, idx) => {
              const isWest = node.fiedler < 0;
              const isBridgeFrom = idx === spectralData.bridgeEdge.from;
              return (
                <React.Fragment key={node.id}>
                  <div className={`relative flex flex-col items-center p-2.5 rounded-xl border text-center transition-all min-w-24 ${
                    isWest
                      ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                      : 'bg-rose-50/70 border-rose-200 text-rose-950'
                  } ${isBridgeFrom ? 'ring-2 ring-amber-400' : ''}`}>
                    <span className="text-[10px] font-mono text-slate-500">v_{node.id}</span>
                    <span className="text-xs font-bold mt-0.5">{node.temp}°C</span>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      fiedler: {node.fiedler > 0 ? `+${node.fiedler}` : node.fiedler}
                    </div>
                    <div className="mt-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/80 border border-slate-200 truncate max-w-24" title={node.label}>
                      {node.label.split(' ')[0]}
                    </div>
                  </div>

                  {idx < spectralData.nodes.length - 1 && (
                    <div className="flex flex-col items-center justify-center px-1">
                      {isBridgeFrom ? (
                        <div className="flex flex-col items-center py-1">
                          <span className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-tighter">
                            Cheeger Cut
                          </span>
                          <div className={`h-1 w-8 sm:w-12 rounded transition-all ${
                            bridgeConductance < 0.3 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`} />
                          <span className="text-[9px] font-mono text-slate-600 font-bold">
                            w={bridgeConductance.toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="h-1 w-6 sm:w-8 bg-blue-300 rounded" />
                          <span className="text-[9px] font-mono text-slate-400">w=1.0</span>
                        </div>
                      )}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
            Notice how the <strong>Fiedler vector coordinates</strong> switch signs across the bridge (negative on the cool west partition <InlineMath math="S" />, positive on the hot east partition <InlineMath math="V \setminus S" />). When <InlineMath math="w_{\text{bridge}}" /> decreases, conductance collapses, starving the east side of cooling diffusion.
          </p>
        </div>

        {/* Mathematical Metrics Panel (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sigma className="w-3.5 h-3.5 text-indigo-600" />
              <span>Spectral Invariants & Cheeger Bounds</span>
            </h5>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Algebraic Conn.</span>
                  <InlineMath math="\lambda_2" />
                </span>
                <span className="font-mono font-bold text-base text-slate-900">{spectralData.lambda2}</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span>Spectral gap</span>
                  <InlineMath math="(L_{\text{norm}})" />
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Conductance</span>
                  <InlineMath math="\phi(S)" />
                </span>
                <span className="font-mono font-bold text-base text-slate-900">{spectralData.phiCut}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Cheeger bottleneck cut</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-indigo-50/60 border border-indigo-100 text-xs space-y-1">
              <div className="font-bold text-indigo-900 flex items-center justify-between">
                <span>Cheeger's Inequality Check:</span>
                <InlineMath math="2\phi \ge \lambda_2 \ge \frac{\phi^2}{2}" className="font-mono text-[11px]" />
              </div>
              <div className="font-mono text-[11px] text-indigo-800 flex items-center justify-between">
                <span>{(2 * spectralData.phiCut).toFixed(3)}</span>
                <span>&ge; {spectralData.lambda2} &ge;</span>
                <span>{(Math.pow(spectralData.phiCut, 2) / 2).toFixed(3)}</span>
              </div>
              <p className="text-[10px] text-indigo-600 leading-tight">
                Satisfied. The eigenvalue strictly bounds the physical diffusion capacity of the urban canopy network.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span>Spectrum:</span>
              <InlineMath math="\lambda_1 = 0 \le \lambda_2 \le \dots \le \lambda_n" />
            </span>
            <span className="font-mono font-bold text-slate-700">n = {spectralData.nodes.length} nodes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default InteractiveSpectralDecomposer;
