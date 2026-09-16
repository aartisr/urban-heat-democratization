import React, { useState } from 'react';
import { 
  BookOpen, 
  FlaskConical, 
  FileText, 
  ShieldCheck, 
  Layers, 
  Sparkles, 
  ArrowRight, 
  ExternalLink,
  Github,
  Award,
  Flame,
  CheckCircle2,
  TreePine,
  Activity
} from 'lucide-react';
import { Navbar, MainView } from './components/Navbar';
import MonographPaper from './components/MonographPaper';
import { UrbanHeatMitigationLab } from './components/UrbanHeatMitigationLab';
import UpgradeToTen from './components/UpgradeToTen';
import VerificationMatrix from './components/VerificationMatrix';
import AddressPlanTool from './components/AddressPlanTool';
import { InteractiveWeightsCalculator } from './components/InteractiveWeightsCalculator';
import { DimensionAuditList } from './components/DimensionAuditList';
import { ScoreOverviewCard } from './components/ScoreOverviewCard';
import { BenchmarkComparison } from './components/BenchmarkComparison';
import { SWOTMatrix } from './components/SWOTMatrix';
import { RoadmapToTen } from './components/RoadmapToTen';
import SpectralGraphFilter from './components/SpectralGraphFilter';
import SensorValidationBench from './components/SensorValidationBench';
import OsmPlayground from './components/OsmPlayground';
import GisApiPlayground from './components/GisApiPlayground';
import GrantPdfGenerator from './components/GrantPdfGenerator';
import MultilingualLocalization from './components/MultilingualLocalization';
import PullRequestSuite from './components/PullRequestSuite';
import { TARGET_METADATA } from './data/evaluationData';

export default function App() {
  const [currentView, setCurrentView] = useState<MainView>('monograph');
  const [workbenchTool, setWorkbenchTool] = useState<string>('mitigation_lab');
  const [policyTool, setPolicyTool] = useState<string>('grant_pdf');
  const [isTenActive, setIsTenActive] = useState<boolean>(true);
  const [auditTab, setAuditTab] = useState<'overview' | 'dimensions' | 'benchmarks' | 'swot' | 'roadmap'>('overview');

  // Navigation handlers to enable bidirectional jumping between Monograph and Live Website
  const handleOpenWorkbenchFromPaper = (toolId: string) => {
    setCurrentView('workbench');
    if (['filter', 'sensor', 'osm', 'gis', 'calculator'].includes(toolId)) {
      setWorkbenchTool(toolId);
    } else {
      setWorkbenchTool('mitigation_lab');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectView = (view: MainView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Universal Responsive Navbar */}
      <Navbar
        currentView={currentView}
        onSelectView={handleSelectView}
        subTool={currentView === 'workbench' ? workbenchTool : currentView === 'policy' ? policyTool : undefined}
        onSelectSubTool={(toolId) => {
          if (currentView === 'workbench') setWorkbenchTool(toolId);
          if (currentView === 'policy') setPolicyTool(toolId);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* VIEW 1: THE RESEARCH MONOGRAPH & JOURNAL */}
        {currentView === 'monograph' && (
          <div className="bg-white rounded-3xl p-4 sm:p-8 lg:p-12 border border-slate-200/80 shadow-sm">
            <MonographPaper onOpenWorkbench={handleOpenWorkbenchFromPaper} />
          </div>
        )}

        {/* VIEW 2: LIVE INTERACTIVE WORKBENCH */}
        {currentView === 'workbench' && (
          <div className="space-y-6">
            {/* Quick Workbench Banner */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1">
                  <FlaskConical className="w-4 h-4" />
                  <span>Interactive Urban Climatology Workbench</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Live Physics & Graph Simulation Sandbox
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Simulate thermodynamic cooling, compute normalized Laplacians, and evaluate empirical ground-truth sensors in real-time.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSelectView('monograph')}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Return to Paper</span>
                </button>
              </div>
            </div>

            {/* Sub-tool dynamic rendering */}
            {workbenchTool === 'mitigation_lab' && <UrbanHeatMitigationLab />}
            {workbenchTool === 'filter' && <SpectralGraphFilter />}
            {workbenchTool === 'sensor' && <SensorValidationBench />}
            {workbenchTool === 'calculator' && <InteractiveWeightsCalculator />}
            {workbenchTool === 'osm' && <OsmPlayground />}
            {workbenchTool === 'gis' && <GisApiPlayground />}
          </div>
        )}

        {/* VIEW 3: POLICY, GRANTS & CIVIC ACTION */}
        {currentView === 'policy' && (
          <div className="space-y-6">
            {/* Policy Banner */}
            <div className="bg-amber-950 text-amber-100 p-6 sm:p-8 rounded-3xl border border-amber-800/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1">
                  <FileText className="w-4 h-4" />
                  <span>Municipal Governance & Environmental Justice</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Civic Democratization & Grant Architecture
                </h2>
                <p className="text-xs text-amber-200/80 mt-1 max-w-xl">
                  Transforming spectral mathematics into municipal bond rating acceptance, FEMA BRIC grants, and street-level tenant cooling action.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSelectView('monograph')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Read Foundations in Paper</span>
                </button>
              </div>
            </div>

            {policyTool === 'grant_pdf' && <GrantPdfGenerator />}
            {policyTool === 'address_plan' && <AddressPlanTool />}
            {policyTool === 'multilingual' && <MultilingualLocalization />}
            {policyTool === 'prs' && <PullRequestSuite />}
          </div>
        )}

        {/* VIEW 4: VERIFICATION & AUDIT MATRIX */}
        {currentView === 'verification' && (
          <VerificationMatrix />
        )}

        {/* VIEW 5: PLATFORM SCORECARD & AUDIT */}
        {currentView === 'audit' && (
          <div className="space-y-6">
            {/* Scorecard Sub-tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'overview', label: 'Scorecard & Verdict' },
                { id: 'dimensions', label: '6 Deep-Dive Dimensions' },
                { id: 'benchmarks', label: 'Platform Benchmarks' },
                { id: 'swot', label: 'SWOT Matrix' },
                { id: 'roadmap', label: 'Roadmap to 10/10' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAuditTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    auditTab === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {auditTab === 'overview' && (
              <div className="space-y-6">
                <ScoreOverviewCard />
                <UpgradeToTen
                  isTenActive={isTenActive}
                  onActivateTen={() => setIsTenActive(prev => !prev)}
                />
              </div>
            )}
            {auditTab === 'dimensions' && <DimensionAuditList />}
            {auditTab === 'benchmarks' && <BenchmarkComparison />}
            {auditTab === 'swot' && <SWOTMatrix />}
            {auditTab === 'roadmap' && <RoadmapToTen />}
          </div>
        )}
      </main>

      {/* Floating Bidirectional Navigation Pill */}
      <aside aria-label="Quick navigation" className="fixed bottom-6 right-6 z-40">
        {currentView === 'monograph' ? (
          <button
            onClick={() => handleSelectView('workbench')}
            className="group px-4 py-3 rounded-2xl bg-slate-950 text-white font-bold text-xs shadow-2xl border border-slate-800 hover:bg-indigo-600 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <FlaskConical className="w-4 h-4 text-emerald-400 group-hover:text-white" />
            <span>Open Interactive Workbench</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
          </button>
        ) : (
          <button
            onClick={() => handleSelectView('monograph')}
            className="group px-4 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs shadow-2xl border border-indigo-500 hover:bg-indigo-700 transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
          >
            <BookOpen className="w-4 h-4 text-amber-300" />
            <span>Read Full Research Monograph</span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-200 group-hover:text-white" />
          </button>
        )}
      </aside>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-800">Urban Heat Democratization Consortium</span>
            <span>•</span>
            <span>Lead Researcher: Aarti S. Ravikumar (Pioneer Charter School of Science II — PCSS II)</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/aartisr/urban-heat-democratization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-mono"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Repository</span>
            </a>
            <span>•</span>
            <a
              href={TARGET_METADATA.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 font-medium"
            >
              <span>Deployed Web App</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <button
              onClick={() => handleSelectView('verification')}
              className="text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 font-medium"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Verifiable</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
