import React, { useMemo } from 'react';
import katex from 'katex';

interface MathProps {
  math: string;
  className?: string;
}

interface BlockMathProps extends MathProps {
  eqNum?: string | number;
  variant?: 'light' | 'dark' | 'academic' | 'minimal';
}

export const InlineMath: React.FC<MathProps> = ({ math, className = '' }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<span class="text-rose-500 font-mono text-xs">${math}</span>`;
    }
  }, [math]);

  return (
    <span
      className={`inline-flex items-center px-1 align-middle text-slate-900 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const BlockMath: React.FC<BlockMathProps> = ({
  math,
  eqNum,
  variant = 'academic',
  className = '',
}) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<div class="text-rose-500 font-mono text-xs text-center">${math}</div>`;
    }
  }, [math]);

  const containerStyles = {
    academic: 'bg-slate-50/90 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 shadow-xs',
    light: 'bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-3 shadow-xs',
    dark: 'bg-slate-900 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 shadow-inner',
    minimal: 'px-2 py-1 text-slate-900',
  }[variant];

  return (
    <div className={`my-3 relative flex items-center justify-between group ${containerStyles} ${className}`}>
      <div
        className="w-full overflow-x-auto overflow-y-hidden text-center py-0.5 text-[15px] sm:text-[16px] leading-relaxed select-all"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {eqNum !== undefined && (
        <span className="shrink-0 pl-3 font-serif text-xs font-semibold text-slate-400 select-none hidden sm:inline-block">
          ({eqNum})
        </span>
      )}
    </div>
  );
};

export default { InlineMath, BlockMath };
