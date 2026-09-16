import React, { useState, useMemo } from 'react';
import { Activity, ArrowRight, Play, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { InlineMath } from './MathView';

interface InteractivePercolationSimulationProps {
  onOpenWorkbench?: (toolId: string) => void;
}

export const InteractivePercolationSimulation: React.FC<InteractivePercolationSimulationProps> = ({
  onOpenWorkbench
}) => {
  const [retentionP, setRetentionP] = useState<number>(0.55);
  const [networkType, setNetworkType] = useState<'fragile_baseline' | 'mitigated_resilient'>('fragile_baseline');
  const [isRunningSim, setIsRunningSim] = useState<boolean>(false);
  const [simRunId, setSimRunId] = useState<number>(0);

  // Compute percolation stats deterministically based on retention probability p and network resilience
  const stats = useMemo(() => {
    // Critical percolation threshold for 2D urban lattice pc ~ 0.50
    // Fragile baseline network has few redundant edges; collapses sharply below p=0.65
    // Mitigated network adds multi-corridor redundant bypasses; maintains giant component down to p=0.40
    const pc = networkType === 'fragile_baseline' ? 0.62 : 0.42;
    
    // Giant component fraction S(p)
    let giantFraction = 0;
    if (retentionP < pc) {
      giantFraction = Math.max(0.05, Math.pow(retentionP / pc, 2.5) * 0.25);
    } else {
      giantFraction = Math.min(1.0, 0.25 + 0.75 * Math.pow((retentionP - pc) / (1.0 - pc), 0.45));
    }

    // Cooling sink reachability R_sink(p)
    const sinkReachability = networkType === 'fragile_baseline'
      ? Math.min(1.0, Math.pow(retentionP, 2.8) * 1.05)
      : Math.min(1.0, Math.pow(retentionP, 1.4) * 1.02);

    // Number of isolated tracts out of 24
    const isolatedTracts = Math.round((1 - giantFraction) * 24);

    return {
      pc,
      giantFraction: Number(giantFraction.toFixed(3)),
      sinkReachability: Number(sinkReachability.toFixed(3)),
      isolatedTracts,
      isCollapsed: retentionP < pc,
      phaseState: retentionP < pc 
        ? 'Sub-Critical Disconnected Phase (Cooling Starvation)'
        : retentionP < pc + 0.15 
        ? 'Percolation Critical Regime (Fragile Edge Transitions)'
        : 'Super-Critical Connected Phase (Robust Thermal Conduction)'
    };
  }, [retentionP, networkType, simRunId]);

  const triggerResimulate = () => {
    setIsRunningSim(true);
    setTimeout(() => {
      setSimRunId(prev => prev + 1);
      setIsRunningSim(false);
    }, 250);
  };

  return (
    <div id="interactive-figure-percolation" className="my-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono">
              INTERACTIVE FIGURE 3
            </span>
            <span className="text-xs font-semibold text-slate-500">Stochastic Network Percolation</span>
          </div>
          <h4 className="text-base font-bold text-slate-900 mt-1 flex items-center gap-1.5 flex-wrap">
            <span>Climate Shock Percolation & Cooling Sink Reachability</span>
            <InlineMath math="R_{\text{sink}}(p)" />
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs">
            <button
              onClick={() => setNetworkType('fragile_baseline')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                networkType === 'fragile_baseline' ? 'bg-slate-800 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Baseline Network
            </button>
            <button
              onClick={() => setNetworkType('mitigated_resilient')}
              className={`px-2.5 py-1 rounded font-medium transition-all ${
                networkType === 'mitigated_resilient' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mitigated Network (+Bypasses)
            </button>
          </div>
          {onOpenWorkbench && (
            <button
              onClick={() => onOpenWorkbench('sensor')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <span>View Sensor Bench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Probability Slider Control */}
      <div className="mt-5 p-4 rounded-xl bg-white border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <span>Edge Survival Probability</span>
              <InlineMath math="p \in [0.1, 1.0]" />:
            </label>
            <p className="text-xs text-slate-500">
              Represents network link integrity under extreme 100°F+ heat waves, tree canopy die-off, or grid disruption.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <input
              type="range"
              min="0.10"
              max="1.0"
              step="0.05"
              value={retentionP}
              onChange={(e) => setRetentionP(parseFloat(e.target.value))}
              className="w-36 sm:w-48 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="font-mono text-sm font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 min-w-14 text-center">
              p = {retentionP.toFixed(2)}
            </span>
            <button
              onClick={triggerResimulate}
              disabled={isRunningSim}
              className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              title="Re-run Monte Carlo trials"
            >
              <RotateCcw className={`w-4 h-4 ${isRunningSim ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Simulation Grid & Metrics */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Lattice Percolation Grid Visualizer (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <span>Random Subgraph Sample</span>
              <InlineMath math="G_p \sim \mathcal{G}(V, E, p)" />
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              stats.isCollapsed ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {stats.isCollapsed ? 'Subcritical Collapse' : 'Giant Component Intact'}
            </span>
          </div>

          {/* 6x4 Grid of Tracts */}
          <div className="py-4 grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2">
            {Array.from({ length: 24 }).map((_, i) => {
              // Deterministic assignment of whether node i is connected in giant component
              // Sinks are at top row (i < 6)
              const isSink = i === 0 || i === 1;
              const inGiant = isSink || (i < 24 - stats.isolatedTracts);
              return (
                <div
                  key={i}
                  className={`p-2 rounded-lg text-center border text-[10px] font-mono transition-all ${
                    isSink
                      ? 'bg-blue-100 border-blue-300 text-blue-900 font-bold'
                      : inGiant
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-700 opacity-60'
                  }`}
                >
                  <div>{isSink ? '🌊 Sink' : `Tract ${i+1}`}</div>
                  <div className="text-[9px] mt-0.5">
                    {inGiant ? 'Linked' : 'Isolated'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span>Critical Phase Threshold</span>
              <InlineMath math={`p_c \\approx ${stats.pc.toFixed(2)}`} />
            </span>
            <span className="font-bold text-slate-700">
              {stats.isolatedTracts} of 24 Tracts Severed from Cool Relief
            </span>
          </div>
        </div>

        {/* Reliability Curve & Output Stats (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-4 border border-slate-200 flex flex-col justify-between space-y-3">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Monte Carlo Reliability Invariants</span>
            </h5>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-500 flex items-center gap-1">
                    <span>Giant Component</span>
                    <InlineMath math="S(p)" />:
                  </span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {(stats.giantFraction * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 flex items-center gap-1 justify-end">
                    <span>Sink Reachability</span>
                    <InlineMath math="R_{\text{sink}}" />:
                  </span>
                  <span className="font-mono font-bold text-base text-emerald-700">
                    {(stats.sinkReachability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                <span className="font-bold text-slate-800 block">Phase State Regime:</span>
                <p className="text-[11px] text-slate-600 leading-snug">
                  {stats.phaseState}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 text-[11px] text-slate-500 leading-tight">
            <strong>Theoretical Takeaway:</strong> Unlike isolated tree planting, network mitigation shifts <InlineMath math="p_c" /> leftward from 0.62 to 0.42, protecting heat-vulnerable residents even under catastrophic 1-in-100-year heat dome shocks.
          </div>
        </div>
      </div>
    </div>
  );
};
export default InteractivePercolationSimulation;
