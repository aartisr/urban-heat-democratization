import React from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';
import { MathFormula, LaTeXText } from './MathFormula';

interface VariableInfo {
  symbol: string;
  name: string;
  unit: string;
  description: string;
}

interface FormulaCardProps {
  title: string;
  formula: string;
  description: string;
  variables: VariableInfo[];
  physicalIntuition?: string;
  onAskAI?: (prompt: string) => void;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  formula,
  description,
  variables,
  physicalIntuition,
  onAskAI
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg text-slate-100">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-lg text-slate-100">
            <LaTeXText text={title} />
          </h3>
        </div>
        {onAskAI && (
          <button
            onClick={() => onAskAI(`Explain the physical intuition and derivation of ${title}: ${formula}`)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ask AI Tutor</span>
          </button>
        )}
      </div>

      {/* KaTeX Professional Formatted Equation Display */}
      <div className="my-4 p-4 bg-slate-950/90 border border-amber-500/30 rounded-xl text-center shadow-inner overflow-x-auto min-h-[64px] flex items-center justify-center">
        <MathFormula math={formula} displayMode={true} />
      </div>

      <p className="text-sm text-slate-300 mb-4 leading-relaxed">
        <LaTeXText text={description} />
      </p>

      {/* Variables Table */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Variable Breakdown & Units
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {variables.map((v, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 bg-slate-800/60 rounded-lg border border-slate-800/80">
              <div className="bg-slate-950 px-2 py-1 rounded border border-slate-700/80 min-w-[36px] text-center flex items-center justify-center shrink-0">
                <MathFormula math={v.symbol} inline={true} className="text-xs text-amber-300 font-bold" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-200 flex items-center gap-1.5 flex-wrap">
                  <span>{v.name}</span>
                  <span className="text-slate-400 font-mono text-[11px] bg-slate-900 px-1 py-0.2 rounded border border-slate-800">
                    [{v.unit}]
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] leading-tight mt-0.5">
                  <LaTeXText text={v.description} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {physicalIntuition && (
        <div className="mt-4 p-3 bg-slate-800/40 border-l-2 border-amber-400 rounded-r-lg text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-amber-300">Physical Insight: </span>
          <LaTeXText text={physicalIntuition} />
        </div>
      )}
    </div>
  );
};
