import React from 'react';
import { 
  Rocket, 
  CheckCircle, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  FileDown, 
  Languages, 
  Radio, 
  Code2,
  Award
} from 'lucide-react';
import { TARGET_METADATA } from '../data/evaluationData';

export const RoadmapToTen: React.FC = () => {
  const steps = [
    {
      phase: "Phase 1: Immediate Enhancements",
      targetDelta: "+0.3 pts (9.2 / 10)",
      title: "Self-Serve Multi-City Ingestion & Geocoding",
      description: "Extend beyond Boston to enable users to type in any global municipality or zip code to pull automated Landsat/Sentinel-3 thermal layers and census overlays.",
      icon: MapPin,
      status: "High Priority"
    },
    {
      phase: "Phase 2: Civic Utility",
      targetDelta: "+0.3 pts (9.5 / 10)",
      title: "1-Click City Council & EPA Grant PDF Generator",
      description: "Allow community advocates to export professional 3-page policy briefs with thermal maps, mitigation ROI, and census equity charts formatted directly for federal/state grant applications.",
      icon: FileDown,
      status: "High Priority"
    },
    {
      phase: "Phase 3: Community Inclusivity",
      targetDelta: "+0.2 pts (9.7 / 10)",
      title: "Multilingual Frontline Community Localization",
      description: "Translate narratives, thermal legends, and case studies into Spanish, Cantonese, Haitian Creole, and Portuguese to ensure frontline immigrant neighborhoods have equal access.",
      icon: Languages,
      status: "Medium Priority"
    },
    {
      phase: "Phase 4: Ground Truth Calibration",
      targetDelta: "+0.2 pts (9.9 / 10)",
      title: "Hyperlocal IoT & Mobile Sensor Stream Ingestion",
      description: "Ingest street-level mobile temperature runs (e.g. bicycle/car mounted sensors) and PurpleAir/heat loggers to ground-truth orbital radiometric readings.",
      icon: Radio,
      status: "Medium Priority"
    },
    {
      phase: "Phase 5: Developer Ecosystem",
      targetDelta: "+0.1 pts (10.0 / 10)",
      title: "Public Open GIS GeoJSON & WMS API Endpoints",
      description: "Provide open REST API endpoints allowing external researchers, GIS analysts, and civic tech hackers to query thermal equity layers programmatically.",
      icon: Code2,
      status: "Ecosystem Growth"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Rocket className="w-5 h-5 text-emerald-400" />
            <span>Strategic Roadmap to a Perfect 10.0 / 10</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Concrete actionable blueprint for scaling <strong>urban-heat.ai-aarti.com</strong> from its strong 8.9 baseline to the definitive gold standard in civic climate tech.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Target Ceiling:</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-sm flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> 10.0 / 10.0
          </span>
        </div>
      </div>

      {/* Roadmap Timeline Cards */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div 
              key={index}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4"
              id={`roadmap-step-${index}`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {step.phase}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      {step.targetDelta}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  {step.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
