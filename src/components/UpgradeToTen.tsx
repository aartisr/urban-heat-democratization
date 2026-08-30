import React, { useState } from 'react';
import { Sparkles, Globe, Activity, Waves, GitPullRequest, Award, ArrowUpRight, CheckCircle } from 'lucide-react';
import OsmPlayground from './OsmPlayground';
import SensorValidationBench from './SensorValidationBench';
import SpectralGraphFilter from './SpectralGraphFilter';
import PullRequestSuite from './PullRequestSuite';
import { motion } from 'motion/react';

interface UpgradeToTenProps {
  onActivateTen: () => void;
  isTenActive: boolean;
}

export default function UpgradeToTen({ onActivateTen, isTenActive }: UpgradeToTenProps) {
  const [activeSubTab, setActiveSubTab] = useState<'osm' | 'sensor' | 'filter' | 'pr'>('osm');

  return (
    <div id="upgrade-to-ten-container" className="space-y-6">
      {/* Hero Banner for 10/10 Upgrade Engine */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg border border-emerald-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1 rounded-full text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>10/10 Master Edition Roadmap</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              The 10/10 Upgrade Engine & Solution Suite
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 leading-relaxed">
              We have engineered the exact mathematical algorithms, automated data pipelines, and empirical cross-validation benches required to turn <strong>urban-heat-democratization</strong> into an immaculate 10/10 platform.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={onActivateTen}
              className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                isTenActive
                  ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/30'
                  : 'bg-white text-slate-900 hover:bg-slate-100 hover:scale-105'
              }`}
            >
              <Award className="w-5 h-5 text-amber-500" />
              <span>{isTenActive ? '★ 10.0/10 Mode Active' : 'Upgrade Rating to 10.0/10'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/60">
        <button
          onClick={() => setActiveSubTab('osm')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'osm'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-600" />
          <span className="truncate">1. OSM Auto-Pipeline</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sensor')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'sensor'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-600" />
          <span className="truncate">2. Sensor Ground Truth</span>
        </button>

        <button
          onClick={() => setActiveSubTab('filter')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'filter'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Waves className="w-4 h-4 text-indigo-600" />
          <span className="truncate">3. Island Laplacian</span>
        </button>

        <button
          onClick={() => setActiveSubTab('pr')}
          className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'pr'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <GitPullRequest className="w-4 h-4 text-slate-700" />
          <span className="truncate">4. Upstream PRs</span>
        </button>
      </div>

      {/* Sub-Tab Viewport */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeSubTab === 'osm' && <OsmPlayground />}
        {activeSubTab === 'sensor' && <SensorValidationBench />}
        {activeSubTab === 'filter' && <SpectralGraphFilter />}
        {activeSubTab === 'pr' && <PullRequestSuite />}
      </motion.div>
    </div>
  );
}
