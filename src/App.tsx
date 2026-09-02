import React, { useState } from 'react';
import { LabStepId } from './types';
import { Header } from './components/Header';
import { Lab1BasicUHI } from './components/Lab1BasicUHI';
import { Lab2Radiation } from './components/Lab2Radiation';
import { Lab3EnergyBalance } from './components/Lab3EnergyBalance';
import { Lab4ThermalInertia } from './components/Lab4ThermalInertia';
import { Lab5UrbanCanyon } from './components/Lab5UrbanCanyon';
import { Lab6GMRFGraph } from './components/Lab6GMRFGraph';
import { InteractiveToyCalculator } from './components/InteractiveToyCalculator';
import { ScenarioSandbox } from './components/ScenarioSandbox';
import { AITutorModal } from './components/AITutorModal';
import { BookOpen, Flame, ExternalLink, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<LabStepId>('lab1-basic-uhi');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiContext, setAiContext] = useState('Urban Thermal Science');

  const handleAskAI = (prompt: string, context = 'Urban Thermal Physics') => {
    setAiPrompt(prompt);
    setAiContext(context);
    setIsAIModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* App Navigation Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAIModal={() => handleAskAI('Explain the general Urban Heat Island surface energy balance framework.')}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {activeTab === 'lab1-basic-uhi' && <Lab1BasicUHI onAskAI={handleAskAI} />}
        {activeTab === 'lab2-radiation' && <Lab2Radiation onAskAI={handleAskAI} />}
        {activeTab === 'lab3-energy-balance' && <Lab3EnergyBalance onAskAI={handleAskAI} />}
        {activeTab === 'lab4-thermal-inertia' && <Lab4ThermalInertia onAskAI={handleAskAI} />}
        {activeTab === 'lab5-canyon-svf' && <Lab5UrbanCanyon onAskAI={handleAskAI} />}
        {activeTab === 'lab6-gmrf-spatial' && <Lab6GMRFGraph onAskAI={handleAskAI} />}
        {activeTab === 'toy-calculator' && <InteractiveToyCalculator onAskAI={handleAskAI} />}
        {activeTab === 'scenario-sandbox' && <ScenarioSandbox />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">Spectral Urbanism: Urban Thermal Math Lab</span>
            <span>•</span>
            <span className="text-slate-500">Based on aartisr/spectral-urbanism math documentation</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleAskAI('What is the physical connection between Sky View Factor, Bowen ratio, and GMRF precision matrices?')}
              className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3" /> Ask AI Thermal Tutor
            </button>
            <a
              href="https://github.com/aartisr/spectral-urbanism/blob/main/docs/Urban_Thermal_Math_Deep_Dive.md"
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
            >
              <span>GitHub Deep Dive Doc</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* AI Tutor Modal */}
      <AITutorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        initialPrompt={aiPrompt}
        contextStep={aiContext}
      />
    </div>
  );
}
