import React, { useState } from 'react';
import { ToyCalculatorInput } from '../types';
import { runProgressiveCalculator } from '../lib/thermalMath';
import { MathFormula, LaTeXText } from './MathFormula';
import { GraphNodeToyExample } from './GraphNodeToyExample';
import { Sliders, Play, Code, CheckCircle, ChevronRight, Terminal, Download, Sparkles, HelpCircle, Network, Calculator } from 'lucide-react';

interface ToyCalculatorProps {
  onAskAI: (prompt: string) => void;
}

export const InteractiveToyCalculator: React.FC<ToyCalculatorProps> = ({ onAskAI }) => {
  const [calculatorMode, setCalculatorMode] = useState<'1d-physics' | 'graph-nodes'>('graph-nodes');
  const [input, setInput] = useState<ToyCalculatorInput>({
    solarInsolation: 900, // W/m^2
    albedo: 0.12, // Dark asphalt
    emissivity: 0.93,
    airTemp: 28.0, // °C
    windSpeed: 2.5, // m/s
    vegetationCover: 0.15, // 15% vegetation
    buildingHeight: 25, // m
    streetWidth: 20, // m
    anthropogenicHeat: 50 // W/m^2
  });

  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const progressiveSteps = runProgressiveCalculator(input);
  const activeStep = progressiveSteps[activeStepIndex] || progressiveSteps[0];

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      input,
      progressiveSteps
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "urban_thermal_math_toy_calc.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Toy Example Mode Selector Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Toy Example Mode:</span>
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setCalculatorMode('graph-nodes')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                calculatorMode === 'graph-nodes'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph & Nodes Toy Example (GMRF)</span>
            </button>
            <button
              onClick={() => setCalculatorMode('1d-physics')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                calculatorMode === '1d-physics'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>1D Point Physics Toy Calculator</span>
            </button>
          </div>
        </div>

        {calculatorMode === '1d-physics' && (
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Calculation JSON</span>
          </button>
        )}
      </div>

      {calculatorMode === 'graph-nodes' ? (
        <GraphNodeToyExample onAskAI={onAskAI} />
      ) : (
        <>
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Interactive 1D Toy Calculator</span>
                  <span>•</span>
                  <span>Progressive Point Physics</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-100">Step-by-Step Urban Thermal Math Evaluator</h2>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Tweak physical inputs below and watch every formula step evaluate sequentially in real time. Inspect executable TypeScript code, variable states, and mathematical outputs at each progressive stage of the Urban Heat Island calculation.
            </p>
          </div>


      {/* Input Sliders Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-slate-100 flex items-center gap-2 text-sm">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Microclimate Toy Calculator Parameters</span>
          </h3>
          <button
            onClick={() => setInput({
              solarInsolation: 900,
              albedo: 0.12,
              emissivity: 0.93,
              airTemp: 28.0,
              windSpeed: 2.5,
              vegetationCover: 0.15,
              buildingHeight: 25,
              streetWidth: 20,
              anthropogenicHeat: 50
            })}
            className="text-xs text-slate-400 hover:text-amber-400 cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Solar Insolation */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Solar Insolation (K_down)</span>
              <span className="font-mono text-amber-400 font-bold">{input.solarInsolation} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="1200"
              step="50"
              value={input.solarInsolation}
              onChange={e => setInput({ ...input, solarInsolation: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Albedo */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Surface Albedo (α)</span>
              <span className="font-mono text-emerald-400 font-bold">{input.albedo}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.80"
              step="0.01"
              value={input.albedo}
              onChange={e => setInput({ ...input, albedo: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Vegetation Cover */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Vegetation Cover (FVC)</span>
              <span className="font-mono text-emerald-400 font-bold">{(input.vegetationCover * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.85"
              step="0.05"
              value={input.vegetationCover}
              onChange={e => setInput({ ...input, vegetationCover: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Anthropogenic Heat */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Anthropogenic Waste Heat</span>
              <span className="font-mono text-orange-400 font-bold">{input.anthropogenicHeat} W/m²</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={input.anthropogenicHeat}
              onChange={e => setInput({ ...input, anthropogenicHeat: parseFloat(e.target.value) })}
              className="w-full accent-orange-500 cursor-pointer"
            />
          </div>

          {/* Building Height */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Building Height (H)</span>
              <span className="font-mono text-purple-400 font-bold">{input.buildingHeight} m</span>
            </div>
            <input
              type="range"
              min="5"
              max="80"
              step="5"
              value={input.buildingHeight}
              onChange={e => setInput({ ...input, buildingHeight: parseFloat(e.target.value) })}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Street Width */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Street Width (W)</span>
              <span className="font-mono text-cyan-400 font-bold">{input.streetWidth} m</span>
            </div>
            <input
              type="range"
              min="8"
              max="60"
              step="2"
              value={input.streetWidth}
              onChange={e => setInput({ ...input, streetWidth: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Rural Air Temp */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Baseline Air Temp (T_air)</span>
              <span className="font-mono text-cyan-300 font-bold">{input.airTemp} °C</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={input.airTemp}
              onChange={e => setInput({ ...input, airTemp: parseFloat(e.target.value) })}
              className="w-full accent-cyan-300 cursor-pointer"
            />
          </div>

          {/* Emissivity */}
          <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-300 font-medium">Surface Emissivity (ε)</span>
              <span className="font-mono text-slate-300 font-bold">{input.emissivity}</span>
            </div>
            <input
              type="range"
              min="0.80"
              max="0.98"
              step="0.01"
              value={input.emissivity}
              onChange={e => setInput({ ...input, emissivity: parseFloat(e.target.value) })}
              className="w-full accent-slate-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Progressive Step Stepper Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
          <span>Progressive Execution Pipeline (Click step to inspect)</span>
          <span className="text-amber-400 font-mono">Step {activeStepIndex + 1} of {progressiveSteps.length}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {progressiveSteps.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStepIndex(idx)}
              className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                activeStepIndex === idx
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold shadow-md'
                  : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                <span>STEP {step.stepNumber}</span>
                {activeStepIndex === idx && <ChevronRight className="w-3 h-3 text-amber-400" />}
              </div>
              <div className="text-xs font-bold leading-tight line-clamp-2">
                <LaTeXText text={step.stepName} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Detailed Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center border border-amber-500/30">
              {activeStep.stepNumber}
            </span>
            <h3 className="font-bold text-slate-100 text-base">
              <LaTeXText text={activeStep.stepName} />
            </h3>
          </div>
          <button
            onClick={() => onAskAI(`Explain step ${activeStep.stepNumber} of urban thermal math: ${activeStep.stepName}. Formula: ${activeStep.formulaTex}`)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ask AI Tutor About Step</span>
          </button>
        </div>

        {/* Formula LaTeX Display */}
        <div className="p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl text-center shadow-inner overflow-x-auto min-h-[64px] flex items-center justify-center">
          <MathFormula math={activeStep.formulaTex} displayMode={true} />
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          <LaTeXText text={activeStep.formulaDescription} />
        </p>

        {/* Executable Code & Evaluated Output Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Evaluated Values */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Evaluated Output State</h4>
            <div className="space-y-2">
              {Object.entries(activeStep.calculatedValues).map(([key, value], idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-900 rounded border border-slate-800/80 text-xs">
                  <span className="text-slate-400 font-medium">{key}:</span>
                  <span className="font-mono font-bold text-amber-400">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-2.5 bg-slate-900/60 rounded border-l-2 border-amber-500 text-xs text-slate-300 leading-relaxed">
              <LaTeXText text={activeStep.explanation} />
            </div>
          </div>

          {/* Code Snippet */}
          <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>TypeScript Code Execution</span>
              <Code className="w-3.5 h-3.5 text-emerald-400" />
            </h4>
            <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800/80 leading-relaxed">
              <code>{activeStep.codeSnippet}</code>
            </pre>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between border-t border-slate-800 pt-3">
          <button
            disabled={activeStepIndex === 0}
            onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            ← Previous Step
          </button>
          <button
            disabled={activeStepIndex === progressiveSteps.length - 1}
            onClick={() => setActiveStepIndex(prev => Math.min(progressiveSteps.length - 1, prev + 1))}
            className="px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Next Step →
          </button>
        </div>
      </div>
    </>
    )}
    </div>
  );
};
