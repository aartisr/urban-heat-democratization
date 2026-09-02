import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Glyph({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12h7M12 8.5v7" />
    </svg>
  );
}

export const Activity = Glyph;
export const AlertCircle = Glyph;
export const ArrowRight = Glyph;
export const Award = Glyph;
export const BarChart3 = Glyph;
export const BookOpen = Glyph;
export const Building2 = Glyph;
export const Check = Glyph;
export const CheckCircle = Glyph;
export const CheckCircle2 = Glyph;
export const Code2 = Glyph;
export const Copy = Glyph;
export const Database = Glyph;
export const DollarSign = Glyph;
export const Download = Glyph;
export const ExternalLink = Glyph;
export const FileCode2 = Glyph;
export const FileJson = Glyph;
export const FileText = Glyph;
export const GitPullRequest = Glyph;
export const Globe = Glyph;
export const Globe2 = Glyph;
export const HeartHandshake = Glyph;
export const Languages = Glyph;
export const Layers = Glyph;
export const MapPin = Glyph;
export const Play = Glyph;
export const Printer = Glyph;
export const RefreshCw = Glyph;
export const Server = Glyph;
export const Share2 = Glyph;
export const ShieldAlert = Glyph;
export const ShieldCheck = Glyph;
export const Sigma = Glyph;
export const Sliders = Glyph;
export const Sparkles = Glyph;
export const Split = Glyph;
export const Terminal = Glyph;
export const TrendingUp = Glyph;
export const Volume2 = Glyph;
export const Waves = Glyph;
