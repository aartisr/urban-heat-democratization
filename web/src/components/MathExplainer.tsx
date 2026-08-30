import { Code, Sigma, Sparkles, BookOpen } from 'lucide-react';

export default function MathExplainer() {
  return (
    <div id="math-explainer-section" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Sigma className="w-5 h-5 text-slate-700" />
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">The Spectral Mathematics</h3>
      </div>

      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        The repository is highly unique in that it rejects superficial spatial overlays (like simple distance buffers) in favor of <strong>Spectral Graph Theory</strong>. This mathematical framework models the flow of cooling accessibility across a weighted urban graph.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: The Graph Laplacian */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h4 className="text-sm font-bold text-slate-800">The Normalized Laplacian Matrix</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              To normalize for highly varying node degrees (representing heterogeneous urban street layouts and densities), the repository employs the normalized Laplacian:
            </p>

            <div className="bg-white border border-slate-100 p-4 rounded-xl text-center font-mono my-3 shadow-inner select-all">
              L = I - D^(-1/2) * W * D^(-1/2)
            </div>

            <div className="text-xs text-slate-500 space-y-1 mt-3">
              <p>• <strong>I</strong> is the Identity Matrix</p>
              <p>• <strong>D</strong> is the Diagonal Degree Matrix</p>
              <p>• <strong>W</strong> is the Adjacency Weights matrix of the urban grid</p>
            </div>
          </div>
        </div>

        {/* Step 2: Fiedler-vector Cheeger Sweep */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h4 className="text-sm font-bold text-slate-800">Cheeger Bounds & Sweeps</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              The second-smallest eigenvector (Fiedler Vector) is calculated to identify the Cheeger bottleneck. The Cheeger conductance <strong>h(G)</strong> is bounded by the second-smallest eigenvalue <strong>λ₂</strong> (spectral gap):
            </p>

            <div className="bg-white border border-slate-100 p-4 rounded-xl text-center font-mono my-3 shadow-inner select-all text-sm">
              h(G) ≤ √ ( 2 * λ₂ )
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              The project's backend sweep algorithm tests cuts ordered by the Fiedler Vector components to find the cut with the absolute minimal conductance, effectively pinpointing the starkest urban thermal boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
