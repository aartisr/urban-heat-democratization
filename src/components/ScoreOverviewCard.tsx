import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Layers, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  HeartHandshake
} from 'lucide-react';
import { TARGET_METADATA, DIMENSIONS } from '../data/evaluationData';

interface ScoreOverviewCardProps {
  onNavigateToTab: (tab: string) => void;
}

export const ScoreOverviewCard: React.FC<ScoreOverviewCardProps> = ({ onNavigateToTab }) => {
  return (
    <div className="space-y-6">
      {/* Executive Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Grade & Score */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left border-b lg:border-b-0 lg:border-r border-slate-800 pb-6 lg:pb-0 lg:pr-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Independent Rigorous Evaluation</span>
            </div>

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-teal-200 tracking-tight">
                {TARGET_METADATA.overallScore}
              </span>
              <span className="text-2xl font-bold text-slate-500">/ 10</span>
            </div>

            <div className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <span>{TARGET_METADATA.ratingGrade}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              Ranked in the top 5% of open-access civic microclimate platforms.
            </p>

            <div className="mt-5 w-full flex flex-col gap-2">
              <a
                href={TARGET_METADATA.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20"
                id="hero-visit-link"
              >
                <span>Inspect urban-heat.ai-aarti.com</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => onNavigateToTab('calculator')}
                className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
                id="adjust-weights-btn"
              >
                <span>Custom Weight Calculator</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Executive Summary & Highlights */}
          <div className="lg:col-span-8 space-y-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <span>{TARGET_METADATA.verdictTitle}</span>
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mt-2">
                <strong>https://urban-heat.ai-aarti.com</strong> is an exemplary open-research and civic-science platform engineered by <strong>Aarti S Ravikumar</strong>. It succeeds where conventional academic remote sensing tools stumble: by turning dense radiometric satellite thermal data into transparent, human-centered cooling equity insights and interactive mitigation simulations for communities and planners.
              </p>
            </div>

            {/* 4 Pillars of Success */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 mt-0.5">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Thermal Equity Focus (9.4 / 10)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Centering environmental justice by revealing disproportionate heat burdens in under-resourced neighborhoods.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Interactive Modeling Lab (8.8 / 10)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Permits dynamic testing of tree canopies, cool roofs, and shade structures with instant temperature delta feedback.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Open Science & Code (9.2 / 10)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Full public repository, clear citation trails, transparent methodology, and zero corporate data lock-in.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Grounded Case Studies (8.6 / 10)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Deep spatial analysis (e.g. Boston urban heat and cooling access) tying redlining history to heat vulnerability.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Six Dimension Score Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Dimension Breakdown (Weighted 10-Point Rubric)</h3>
            <p className="text-xs text-slate-400">Click any dimension card to review sub-criteria and qualitative evidence.</p>
          </div>
          <button
            onClick={() => onNavigateToTab('dimensions')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
          >
            <span>View All Criteria</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DIMENSIONS.map((dim) => {
            const scorePercentage = (dim.score / 10) * 100;
            return (
              <div
                key={dim.id}
                onClick={() => onNavigateToTab('dimensions')}
                className="group p-5 rounded-xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer shadow-md flex flex-col justify-between"
                id={`card-dim-${dim.id}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      {dim.category}
                    </span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      Weight: {(dim.weight * 100).toFixed(0)}%
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition flex items-center gap-1.5">
                    {dim.title}
                  </h4>

                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {dim.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400">Rating Score</span>
                    <span className="font-bold text-slate-200">
                      <span className="text-emerald-400 text-sm font-black">{dim.score.toFixed(1)}</span> / 10
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${scorePercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Summary Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-800/30">
          <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Key Strengths & Standout Innovations</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Democratized Urban Science:</strong> Replaces intimidating GIS terminology with accessible metrics (e.g. tree canopy deficits, cooling proximity).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Transparent Scenario Sandbox:</strong> Lets non-programmers simulate how +15% tree cover or cool pavement alters local heat indexes.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">•</span>
              <span><strong>Uncompromising Research Rigor:</strong> Clearly outlines data provenance, remote sensing satellites, and methodological limitations without sensationalizing.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-xl bg-amber-950/20 border border-amber-800/30">
          <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Strategic Growth Areas to Reach a Perfect 10.0</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Broader City Automation:</strong> Expanding from curated flagship case studies (like Boston) into an on-demand multi-city ingestion pipeline.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Municipal Policy Brief Exporter:</strong> Providing 1-click formatted PDF policy dossiers for city council testimonies and grant proposals.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">•</span>
              <span><strong>Microclimate Sensor Sync:</strong> Ingesting hyperlocal street-level IoT sensor readings to augment satellite Land Surface Temperature (LST).</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
