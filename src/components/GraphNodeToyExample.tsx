import React, { useState, useMemo } from 'react';
import { MathFormula, LaTeXText } from './MathFormula';
import { LandCoverType } from '../types';
import { LAND_COVER_CONFIGS } from '../lib/gmrfGraph';
import { Network, Sliders, ChevronRight, RefreshCw, Play, Sparkles, HelpCircle, ArrowRight, Activity, CheckCircle } from 'lucide-react';

interface GraphNodeToyExampleProps {
  onAskAI: (prompt: string) => void;
}

interface ToyNode {
  id: number;
  name: string;
  label: string;
  landCover: LandCoverType;
  baseTemp: number;
  x: number; // canvas percent
  y: number; // canvas percent
}

const DEFAULT_NODES: ToyNode[] = [
  { id: 1, name: 'Node 1 (N₁)', label: 'Asphalt Road', landCover: 'asphalt', baseTemp: 38.0, x: 20, y: 30 },
  { id: 2, name: 'Node 2 (N₂)', label: 'Concrete Plaza', landCover: 'concrete', baseTemp: 34.5, x: 80, y: 30 },
  { id: 3, name: 'Node 3 (N₃)', label: 'High Building', landCover: 'building', baseTemp: 39.5, x: 20, y: 75 },
  { id: 4, name: 'Node 4 (N₄)', label: 'Tree Canopy', landCover: 'tree', baseTemp: 25.5, x: 80, y: 75 },
];

// Edges connecting nodes: (1-2), (1-3), (2-4), (3-4)
const EDGES: [number, number][] = [
  [1, 2],
  [1, 3],
  [2, 4],
  [3, 4]
];

export const GraphNodeToyExample: React.FC<GraphNodeToyExampleProps> = ({ onAskAI }) => {
  const [nodes, setNodes] = useState<ToyNode[]>(DEFAULT_NODES);
  const [smoothingAlpha, setSmoothingAlpha] = useState<number>(0.35);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [iterationK, setIterationK] = useState<number>(5);

  // Re-initialize nodes to defaults
  const handleResetNodes = () => {
    setNodes(DEFAULT_NODES);
    setSmoothingAlpha(0.35);
    setIterationK(5);
  };

  // Change node land cover
  const handleNodeCoverChange = (nodeId: number, cover: LandCoverType) => {
    const cfg = LAND_COVER_CONFIGS[cover];
    setNodes(prev =>
      prev.map(n =>
        n.id === nodeId
          ? {
              ...n,
              landCover: cover,
              label: cfg.name.split('/')[0].trim(),
              baseTemp: cfg.baseTemp
            }
          : n
      )
    );
  };

  // Compute step-by-step Gauss-Seidel spatial temperature vectors for iterations k = 0 to 25
  const iterationsHistory = useMemo(() => {
    const baseVector = nodes.map(n => n.baseTemp);
    const history: number[][] = [];
    history.push([...baseVector]); // k=0

    let currentVector = [...baseVector];
    const neighborsMap: Record<number, number[]> = {
      1: [2, 3],
      2: [1, 4],
      3: [1, 4],
      4: [2, 3]
    };

    for (let k = 1; k <= 25; k++) {
      const nextVector = [...currentVector];
      for (let i = 0; i < 4; i++) {
        const nodeId = i + 1;
        const neighbors = neighborsMap[nodeId];
        const neighborSum = neighbors.reduce((sum, nId) => sum + currentVector[nId - 1], 0);
        const neighborAvg = neighborSum / neighbors.length;

        // T_i^(k+1) = (1 - alpha) * T_base_i + alpha * mean(T_neighbors)
        nextVector[i] = (1 - smoothingAlpha) * baseVector[i] + smoothingAlpha * neighborAvg;
      }
      currentVector = nextVector;
      history.push([...currentVector]);
    }

    return history;
  }, [nodes, smoothingAlpha]);

  const currentTemps = iterationsHistory[Math.min(iterationK, iterationsHistory.length - 1)];

  // Adjacency Matrix A (4x4)
  const adjacencyMatrix = [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 1, 1, 0]
  ];

  // Degree Matrix D (4x4)
  const degreeMatrix = [
    [2, 0, 0, 0],
    [0, 2, 0, 0],
    [0, 0, 2, 0],
    [0, 0, 0, 2]
  ];

  // Graph Laplacian L = D - A
  const laplacianMatrix = [
    [2, -1, -1, 0],
    [-1, 2, 0, -1],
    [-1, 0, 2, -1],
    [0, -1, -1, 2]
  ];

  // Precision Matrix Q = I + alpha * L
  const precisionMatrix = laplacianMatrix.map((row, r) =>
    row.map((val, c) => (r === c ? 1 + smoothingAlpha * val : smoothingAlpha * val))
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
              <Network className="w-3.5 h-3.5" />
              <span>GMRF Graph Toy Example</span>
              <span>•</span>
              <span>4-Node Microclimate Network</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100">Step-by-Step Graph & Node Thermal Solver</h2>
          </div>
          <button
            onClick={handleResetNodes}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Toy Graph</span>
          </button>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          <LaTeXText text="This toy example demonstrates how urban spatial heat propagates across a 4-node graph using a Gaussian Markov Random Field precision matrix $\mathbf{Q} = \tau(\mathbf{I} + \kappa^2 \mathbf{L})$. Follow each step to see node baseline temperatures, adjacency topology, Laplacian matrix construction, and iterative temperature diffusion!" />
        </p>
      </div>

      {/* Main Interactive Graph Display + Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Graph Visualizer Canvas (Left/Top) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
              <Network className="w-4 h-4 text-amber-400" />
              <span>Interactive 4-Node Graph Topology Canvas</span>
            </h3>
            <span className="text-xs font-mono text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
              Iteration k = {iterationK}
            </span>
          </div>

          {/* SVG Canvas for 4 Nodes */}
          <div className="relative w-full h-72 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden p-4 flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Draw Edge Lines */}
              {EDGES.map(([srcId, tgtId], idx) => {
                const src = nodes.find(n => n.id === srcId)!;
                const tgt = nodes.find(n => n.id === tgtId)!;
                return (
                  <line
                    key={idx}
                    x1={`${src.x}%`}
                    y1={`${src.y}%`}
                    x2={`${tgt.x}%`}
                    y2={`${tgt.y}%`}
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    className="animate-pulse opacity-60"
                  />
                );
              })}
            </svg>

            {/* Render 4 Interactive Node Cards */}
            {nodes.map((node, i) => {
              const currentTemp = currentTemps[i];
              const tempDiff = currentTemp - node.baseTemp;
              const cfg = LAND_COVER_CONFIGS[node.landCover];

              return (
                <div
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-44 bg-slate-900/95 border-2 border-amber-500/50 hover:border-amber-400 rounded-xl p-2.5 shadow-xl transition-all z-10"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-amber-400 font-mono">N{node.id}</span>
                    <span className="text-[10px] font-semibold text-slate-300">{cfg.icon} {node.label}</span>
                  </div>

                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center my-1">
                    <div className="text-xs text-slate-400">Inferred Temp</div>
                    <div className="text-base font-bold font-mono text-amber-300">{currentTemp.toFixed(1)} °C</div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                      <span>Base: {node.baseTemp}°C</span>
                      <span className={tempDiff > 0 ? 'text-red-400 font-bold' : tempDiff < 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                        ({tempDiff >= 0 ? `+${tempDiff.toFixed(1)}` : tempDiff.toFixed(1)})
                      </span>
                    </div>
                  </div>

                  {/* Node Cover Selector */}
                  <select
                    value={node.landCover}
                    onChange={e => handleNodeCoverChange(node.id, e.target.value as LandCoverType)}
                    className="w-full text-[11px] bg-slate-950 text-slate-200 border border-slate-800 rounded px-1.5 py-1 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {(Object.keys(LAND_COVER_CONFIGS) as LandCoverType[]).map(type => (
                      <option key={type} value={type}>
                        {LAND_COVER_CONFIGS[type].icon} {LAND_COVER_CONFIGS[type].name.split('/')[0]}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>

          {/* Iteration Control Slider */}
          <div className="space-y-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Gauss-Seidel Heat Propagation Iteration (k):</span>
              </span>
              <span className="font-mono text-amber-400 font-bold text-sm">Step k = {iterationK}</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              step="1"
              value={iterationK}
              onChange={e => setIterationK(parseInt(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>k=0 (Initial Base Temps)</span>
              <span>k=1 (1st Neighbor Mix)</span>
              <span>k=5 (Mid Diffusion)</span>
              <span>k=25 (Thermal Equilibrium)</span>
            </div>
          </div>
        </div>

        {/* Graph Coupling Controls & Summary (Right/Top) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>GMRF Spatial Coupling Parameter</span>
            </h3>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Spatial Coupling Weight (α)</span>
                <span className="font-mono text-amber-400 font-bold">{smoothingAlpha}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.75"
                step="0.05"
                value={smoothingAlpha}
                onChange={e => setSmoothingAlpha(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0.05 (Isolated Nodes)</span>
                <span>0.35 (Medium Coupling)</span>
                <span>0.75 (High Diffusion)</span>
              </div>
            </div>

            {/* Live Vector Inspector */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span><LaTeXText text="Temperature Vector $\mathbf{T}^{(k)}$" /></span>
                <span className="text-[10px] font-mono text-amber-400">k={iterationK}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {nodes.map((n, i) => (
                  <div key={n.id} className="bg-slate-900 p-2 rounded border border-slate-800 flex justify-between items-center">
                    <span className="text-amber-400 font-bold">T_{n.id}:</span>
                    <span className="text-slate-100 font-bold">{currentTemps[i].toFixed(2)} °C</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onAskAI(`Explain the 4-node GMRF graph model calculation at iteration k=${iterationK} with spatial weight alpha=${smoothingAlpha}. Current temperatures: N1=${currentTemps[0].toFixed(1)}C, N2=${currentTemps[1].toFixed(1)}C, N3=${currentTemps[2].toFixed(1)}C, N4=${currentTemps[3].toFixed(1)}C.`)}
            className="w-full py-2 px-3 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask AI Tutor to Explain Graph Step</span>
          </button>
        </div>
      </div>

      {/* 6-Step Graph Pipeline Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Step-by-Step Graph Pipeline Breakdown</span>
          </h3>
          <span className="text-xs text-slate-400">Click a step below to inspect every matrix and equation</span>
        </div>

        {/* Step Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { id: 1, title: 'Step 1: Nodes', desc: 'Base Temps μ' },
            { id: 2, title: 'Step 2: Adjacency', desc: 'Matrix A' },
            { id: 3, title: 'Step 3: Laplacian', desc: 'Matrix L' },
            { id: 4, title: 'Step 4: Precision', desc: 'Matrix Q' },
            { id: 5, title: 'Step 5: Iteration', desc: 'Gauss-Seidel' },
            { id: 6, title: 'Step 6: Equilibrium', desc: 'Cooling Effect' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                activeStep === s.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono uppercase text-amber-400">STEP {s.id}</div>
              <div className="text-xs font-semibold mt-0.5">{s.title.split(':')[1]}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>

        {/* Step Content Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
          {activeStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center border border-amber-500/30">1</span>
                  <span><LaTeXText text="Step 1: Microclimate Node Definitions & Initial Baseline Vector ($\boldsymbol{\mu}$)" /></span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LaTeXText text="Each graph node $N_i$ represents an urban land cover element with an uncoupled microclimate base temperature $T_i^{(0)}$ determined by its surface albedo $\alpha$, anthropogenic heat $Q_F$, and vegetation density." />
              </p>

              {/* Math Display */}
              <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/20 text-center">
                <MathFormula math="\boldsymbol{\mu} = \begin{pmatrix} T_1^{(0)} \\ T_2^{(0)} \\ T_3^{(0)} \\ T_4^{(0)} \end{pmatrix} = \begin{pmatrix} 38.0^\circ\text{C} \\ 34.5^\circ\text{C} \\ 39.5^\circ\text{C} \\ 25.5^\circ\text{C} \end{pmatrix}" />
              </div>

              {/* Node Summary Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                {nodes.map(n => (
                  <div key={n.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <div className="font-bold text-amber-400 font-mono">N{n.id}: {n.label}</div>
                    <div className="text-slate-300">Base Temp: <span className="font-mono font-bold text-white">{n.baseTemp}°C</span></div>
                    <div className="text-[10px] text-slate-400">Land Cover: {LAND_COVER_CONFIGS[n.landCover].name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center border border-amber-500/30">2</span>
                  <span><LaTeXText text="Step 2: Spatial Graph Topology & Adjacency Matrix ($\mathbf{A}$)" /></span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LaTeXText text="The symmetric Adjacency Matrix $\mathbf{A} \in \mathbb{R}^{4 \times 4}$ encodes spatial neighborhood connectivity between graph nodes. An entry $A_{ij} = 1$ indicates that node $N_i$ and node $N_j$ share an advective/conductive spatial border." />
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/20 text-center">
                  <MathFormula math="\mathbf{A} = \begin{pmatrix} 0 & 1 & 1 & 0 \\ 1 & 0 & 0 & 1 \\ 1 & 0 & 0 & 1 \\ 0 & 1 & 1 & 0 \end{pmatrix}" />
                </div>
                <div className="space-y-1 text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="font-semibold text-amber-300">Graph Connections:</div>
                  <div><LaTeXText text="• Edge $(N_1, N_2)$: Asphalt Road $\leftrightarrow$ Concrete Plaza" /></div>
                  <div><LaTeXText text="• Edge $(N_1, N_3)$: Asphalt Road $\leftrightarrow$ High Building" /></div>
                  <div><LaTeXText text="• Edge $(N_2, N_4)$: Concrete Plaza $\leftrightarrow$ Tree Canopy" /></div>
                  <div><LaTeXText text="• Edge $(N_3, N_4)$: High Building $\leftrightarrow$ Tree Canopy" /></div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center border border-amber-500/30">3</span>
                  <span><LaTeXText text="Step 3: Degree Matrix ($\mathbf{D}$) & Discrete Graph Laplacian ($\mathbf{L} = \mathbf{D} - \mathbf{A}$)" /></span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LaTeXText text="The Graph Laplacian $\mathbf{L} = \mathbf{D} - \mathbf{A}$ acts as the discrete differential operator measuring spatial curvature. The diagonal contains node degrees $d_i = \sum_j A_{ij} = 2$, and off-diagonals are $-1$ for connected edges." />
              </p>

              <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/20 text-center">
                <MathFormula math="\mathbf{L} = \mathbf{D} - \mathbf{A} = \begin{pmatrix} 2 & -1 & -1 & 0 \\ -1 & 2 & 0 & -1 \\ -1 & 0 & 2 & -1 \\ 0 & -1 & -1 & 2 \end{pmatrix}" />
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center border border-amber-500/30">4</span>
                  <span><LaTeXText text="Step 4: Spatial Precision Matrix ($\mathbf{Q} = \tau (\mathbf{I} + \kappa^2 \mathbf{L})$)" /></span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LaTeXText text="In a Gaussian Markov Random Field, the precision matrix $\mathbf{Q} = \boldsymbol{\Sigma}^{-1}$ represents inverse covariance. Non-zero entries $Q_{ij} \neq 0$ indicate direct conditional spatial dependence between microclimate nodes." />
              </p>

              <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/20 text-center">
                <MathFormula math={`\\mathbf{Q} = \\mathbf{I} + ${smoothingAlpha} \\mathbf{L} = \\begin{pmatrix} ${(1 + 2*smoothingAlpha).toFixed(2)} & ${(-smoothingAlpha).toFixed(2)} & ${(-smoothingAlpha).toFixed(2)} & 0 \\\\ ${(-smoothingAlpha).toFixed(2)} & ${(1 + 2*smoothingAlpha).toFixed(2)} & 0 & ${(-smoothingAlpha).toFixed(2)} \\\\ ${(-smoothingAlpha).toFixed(2)} & 0 & ${(1 + 2*smoothingAlpha).toFixed(2)} & ${(-smoothingAlpha).toFixed(2)} \\\\ 0 & ${(-smoothingAlpha).toFixed(2)} & ${(-smoothingAlpha).toFixed(2)} & ${(1 + 2*smoothingAlpha).toFixed(2)} \\end{pmatrix}`} />
              </div>
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center border border-amber-500/30">5</span>
                  <span><LaTeXText text="Step 5: Iterative Heat Diffusion Update Equation ($k=0 \to 25$)" /></span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LaTeXText text="At iteration step $k+1$, each node updates its temperature as a weighted combination of its baseline microclimate $T_i^{(0)}$ and the average temperature of its connected neighbor nodes $\mathcal{N}(i)$:" />
              </p>

              <div className="p-3 bg-slate-900 rounded-lg border border-amber-500/20 text-center">
                <MathFormula math={`T_i^{(k+1)} = (1 - \\alpha) T_i^{(0)} + \\alpha \\frac{\\sum_{j \\in \\mathcal{N}(i)} T_j^{(k)}}{|\\mathcal{N}(i)|} \\quad (\\text{where } \\alpha = ${smoothingAlpha})`} />
              </div>

              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-300">Calculated Node Updates for Step k = {iterationK}:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  {nodes.map((n, i) => (
                    <div key={n.id} className="bg-slate-950 p-2 rounded border border-slate-800">
                      <span className="text-amber-400 font-bold">N{n.id} ({n.label}):</span>
                      <div className="text-slate-200 mt-0.5">
                        {currentTemps[i].toFixed(2)} °C
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 6 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs flex items-center justify-center border border-amber-500/30">6</span>
                  <span>Step 6: Spatial Equilibrium & Greening Mitigation Impact</span>
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <LaTeXText text="Notice how changing a single hot node (e.g., converting Node $N_3$ from High-Density Building to Urban Tree Canopy) lowers not only $N_3$, but also diffuses cooling across neighboring Nodes $N_1$ and $N_4$ through spatial graph coupling!" />
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">Graph Average Temperature:</span>
                  <span className="text-xl font-bold font-mono text-white">
                    {(currentTemps.reduce((a, b) => a + b, 0) / 4).toFixed(1)} °C
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                  <span className="text-amber-400 font-bold block">Thermal Disparity (Max - Min):</span>
                  <span className="text-xl font-bold font-mono text-purple-400">
                    {(Math.max(...currentTemps) - Math.min(...currentTemps)).toFixed(1)} °C
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
