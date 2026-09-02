import React, { useMemo } from 'react';
import katex from 'katex';

interface MathFormulaProps {
  math: string;
  displayMode?: boolean;
  className?: string;
  inline?: boolean;
}

export const MathFormula: React.FC<MathFormulaProps> = ({
  math,
  displayMode = true,
  className = '',
  inline = false
}) => {
  const isInline = inline || !displayMode;

  const html = useMemo(() => {
    if (!math) return '';
    try {
      // Clean up escaped backslashes if double-escaped
      const cleanMath = math.replace(/\\\\/g, '\\');
      return katex.renderToString(cleanMath, {
        displayMode: !isInline,
        throwOnError: false,
        trust: true,
        strict: false
      });
    } catch (err) {
      console.error('KaTeX rendering error for math:', math, err);
      return math;
    }
  }, [math, isInline]);

  if (isInline) {
    return (
      <span
        className={`inline-math font-serif text-amber-300 font-medium px-0.5 ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <div
      className={`block-math font-serif text-amber-300 text-lg sm:text-xl md:text-2xl tracking-wide py-2 px-3 overflow-x-auto my-1 flex justify-center items-center ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

/**
 * LaTeXText Component
 * Parses string containing $inline math$ and $$block math$$ or LaTeX tokens
 * and renders them gracefully.
 */
interface LaTeXTextProps {
  text: string;
  className?: string;
}

export const LaTeXText: React.FC<LaTeXTextProps> = ({ text, className = '' }) => {
  const parts = useMemo(() => {
    if (!text) return [];

    // Split by $...$ or $$...$$
    // Regex matches $$...$$ or $...$
    const regex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g;
    const tokens = text.split(regex);

    return tokens.map((token, index) => {
      if (token.startsWith('$$') && token.endsWith('$$')) {
        const math = token.slice(2, -2);
        return <MathFormula key={index} math={math} displayMode={true} />;
      } else if (token.startsWith('$') && token.endsWith('$')) {
        const math = token.slice(1, -1);
        return <MathFormula key={index} math={math} inline={true} />;
      } else {
        return <span key={index}>{token}</span>;
      }
    });
  }, [text]);

  return <span className={className}>{parts}</span>;
};
