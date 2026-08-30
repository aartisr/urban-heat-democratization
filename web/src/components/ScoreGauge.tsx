import { motion } from 'motion/react';
import { Star, Award } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
}

export default function ScoreGauge({ score, maxScore = 10 }: ScoreGaugeProps) {
  // Calculate percentage for circular stroke
  const percentage = (score / maxScore) * 100;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Rating label based on score
  const getRatingLabel = (val: number) => {
    if (val >= 9.5) return 'World-Class';
    if (val >= 9.0) return 'Outstanding';
    if (val >= 8.0) return 'Excellent';
    if (val >= 7.0) return 'Very Good';
    return 'Good';
  };

  return (
    <div id="score-gauge-container" className="flex flex-col items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
      <div className="relative w-48 h-48 flex items-center justify-center">
        {/* SVG Circle Gauge */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-100"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Animated score circle */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-emerald-500"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <motion.span 
            className="text-5xl font-black text-slate-800 tracking-tight"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            key={score} // Forces animation when score changes
            transition={{ duration: 0.3 }}
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-widest">Out of {maxScore}</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-sm font-bold border border-emerald-100">
          <Award className="w-4 h-4" />
          <span>{getRatingLabel(score)} Project</span>
        </div>
        <p className="text-xs text-slate-500 mt-2 font-medium">
          A rare combination of mathematical rigor & civic utility
        </p>
      </div>
    </div>
  );
}
