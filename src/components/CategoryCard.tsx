import { Metric } from '../types';
import { motion } from 'motion/react';
import { CheckCircle2, Award, Scale, HelpCircle } from 'lucide-react';

interface CategoryCardProps {
  key?: string | number;
  metric: Metric;
  onWeightChange: (id: string, weight: number) => void;
}

export default function CategoryCard({ metric, onWeightChange }: CategoryCardProps) {
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 9.5) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 9.0) return 'text-teal-600 bg-teal-50 border-teal-100';
    if (score >= 8.0) return 'text-sky-600 bg-sky-50 border-sky-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 9.5) return 'bg-emerald-500';
    if (score >= 9.0) return 'bg-teal-500';
    if (score >= 8.0) return 'bg-sky-500';
    return 'bg-amber-500';
  };

  return (
    <div 
      id={`metric-card-${metric.id}`}
      className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">{metric.name}</h3>
            <span className={`px-2 py-0.5 text-xs font-bold rounded-md border ${getScoreColor(metric.score)}`}>
              Score: {metric.score.toFixed(1)}/10
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{metric.description}</p>
        </div>

        {/* Visual score pill */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          <Scale className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-semibold text-slate-500">Weight:</span>
          <span className="text-xs font-bold text-slate-800">{Math.round(metric.weight * 100)}%</span>
        </div>
      </div>

      {/* Progress Bar for Score */}
      <div className="mt-4 bg-slate-100 h-2 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${getScoreBarColor(metric.score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${metric.score * 10}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Weight adjustment slider */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Adjust Weight (Importance)</span>
          <span className="font-bold text-slate-600">{Math.round(metric.weight * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round(metric.weight * 100)}
          onChange={(e) => onWeightChange(metric.id, Number(e.target.value) / 100)}
          className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize accent-slate-600 focus:outline-none"
        />
      </div>

      {/* Bullet points detailing the evaluation */}
      <div className="mt-5 bg-slate-50/50 p-4 rounded-xl border border-slate-50">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Evidentiary Points</h4>
        <ul className="space-y-2.5">
          {metric.details.map((detail, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 leading-normal">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
