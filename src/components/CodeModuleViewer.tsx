import React, { useState } from 'react';
import { Code, Copy, Check, Terminal, Play } from 'lucide-react';

interface CodeModuleViewerProps {
  title: string;
  stepNumber: number;
  codeSnippet: string;
  calculatedValues: Record<string, number | string>;
  explanation: string;
}

export const CodeModuleViewer: React.FC<CodeModuleViewerProps> = ({
  title,
  stepNumber,
  codeSnippet,
  calculatedValues,
  explanation
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'output' | 'code'>('output');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
            {stepNumber}
          </span>
          <h4 className="font-semibold text-sm text-slate-100">{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('output')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                activeTab === 'output'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Evaluated Output
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                activeTab === 'code'
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3 h-3" />
              <span>TS Code</span>
            </button>
          </div>
          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer rounded bg-slate-900 border border-slate-800"
            title="Copy Code Snippet"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'output' ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {Object.entries(calculatedValues).map(([key, val], idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80">
                  <span className="text-xs text-slate-400 font-medium">{key}:</span>
                  <span className="text-sm font-mono font-bold text-amber-400">{val}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded border-l-2 border-amber-500 leading-relaxed">
              {explanation}
            </p>
          </div>
        ) : (
          <div className="relative">
            <pre className="bg-slate-950 p-3.5 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800 leading-relaxed">
              <code>{codeSnippet}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
