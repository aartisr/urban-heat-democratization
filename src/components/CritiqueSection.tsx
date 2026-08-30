import { AlertTriangle, Lightbulb, Zap, TrendingUp } from 'lucide-react';

export default function CritiqueSection() {
  return (
    <div id="critique-section" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Lightbulb className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">Path to 10/10: Strategic Recommendations</h3>
      </div>

      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        While the <strong>urban-heat-democratization</strong> project is an outstanding, world-class model of transparent civic research, addressing the following gaps would elevate it to a flawless 10/10:
      </p>

      <div className="space-y-4">
        {/* Gap 1 */}
        <div className="flex gap-4 items-start p-4 bg-amber-50/40 rounded-xl border border-amber-100/40">
          <div className="p-2 bg-amber-100/50 rounded-lg text-amber-700 mt-0.5 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Dynamic OpenStreetMap Extraction Pipeline</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Currently, non-flagship cities (like New York, Chicago, LA) are "upload-first," requiring users to manually extract and upload administrative boundaries. Automating this via a direct API link to OpenStreetMap's Overpass API would drastically reduce user friction and enhance scalability.
            </p>
          </div>
        </div>

        {/* Gap 2 */}
        <div className="flex gap-4 items-start p-4 bg-blue-50/40 rounded-xl border border-blue-100/40">
          <div className="p-2 bg-blue-100/50 rounded-lg text-blue-700 mt-0.5 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Local Validation Framework</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Although the project notes the crucial distinction between "repeatability" and "real-world validity," it does not provide an automated tool or notebook to ingest real-world temperature sensor data (e.g. from weather stations or crowd-sourced sensors) to perform validation statistics automatically.
            </p>
          </div>
        </div>

        {/* Gap 3 */}
        <div className="flex gap-4 items-start p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/40">
          <div className="p-2 bg-emerald-100/50 rounded-lg text-emerald-700 mt-0.5 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Edge Case Resolution for Extreme Graphs</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              In highly disconnected or island-heavy coastal cities (such as Boston's harbor islands or Venice-style canal cities), the normalized Laplacian can yield extreme eigenvalue clusters that skew Fiedler cuts. Implementing a specialized subgraph-filtering algorithm for islands would increase analytical robustness.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
