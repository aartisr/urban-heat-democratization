import { Code, Sigma, Sparkles, BookOpen } from 'lucide-react';
import { BlockMath, InlineMath } from './MathView';

export default function MathExplainer() {
  return (
    <div id="math-explainer-section" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <Sigma className="w-5 h-5 text-indigo-700" />
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">The Spectral Mathematics</h3>
      </div>

      <p className="text-sm text-slate-500 mb-6 leading-relaxed">
        The repository is highly unique in that it rejects superficial spatial overlays (like simple distance buffers) in favor of <strong>Spectral Graph Theory</strong>. This mathematical framework models the flow of cooling accessibility across a weighted urban graph.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 1: The Graph Laplacian */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-900 text-white font-bold text-xs flex items-center justify-center font-mono">1</span>
              <h4 className="text-sm font-bold text-slate-800">The Normalized Laplacian Matrix</h4>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              To normalize for highly varying node degrees (representing heterogeneous urban street layouts and densities), the repository employs the normalized Laplacian:
            </p>

            <BlockMath 
              math="L_{\text{norm}} = I - D^{-1/2} W D^{-1/2}" 
              eqNum="1" 
              variant="academic" 
            />

            <div className="text-xs text-slate-600 space-y-1.5 mt-3 font-serif">
              <p>• <InlineMath math="I" /> is the Identity Matrix</p>
              <p>• <InlineMath math="D" /> is the Diagonal Degree Matrix with <InlineMath math="D_{ii} = \sum_{j} W_{ij}" /></p>
              <p>• <InlineMath math="W" /> is the Adjacency Weights matrix of the urban thermal grid</p>
            </div>
          </div>
        </div>

        {/* Step 2: Fiedler-vector Cheeger Sweep */}
        <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-indigo-900 text-white font-bold text-xs flex items-center justify-center font-mono">2</span>
              <h4 className="text-sm font-bold text-slate-800">Cheeger Bounds & Sweeps</h4>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed mb-3">
              The second-smallest eigenvector (Fiedler Vector) is calculated to identify the Cheeger bottleneck. The Cheeger conductance <InlineMath math="h(G)" /> is bounded by the second-smallest eigenvalue <InlineMath math="\lambda_2" /> (spectral gap):
            </p>

            <BlockMath 
              math="h(G) \le \sqrt{2 \lambda_2}" 
              eqNum="2" 
              variant="academic" 
            />

            <p className="text-xs text-slate-500 leading-relaxed mt-3">
              The project's backend sweep algorithm tests cuts ordered by the Fiedler Vector components to find the cut with the absolute minimal conductance, effectively pinpointing the starkest urban thermal boundaries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
