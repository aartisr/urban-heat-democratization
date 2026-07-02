import { useMemo } from "react";
import katex from "katex";

type MathBlockProps = {
  tex: string;
  className?: string;
};

export function MathBlock({ tex, className = "" }: MathBlockProps) {
  const html = useMemo(() => katex.renderToString(tex, {
    displayMode: true,
    throwOnError: false,
    strict: "ignore",
  }), [tex]);

  return (
    <div className={`math-block-shell ${className}`.trim()}>
      <div data-testid="react-katex" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
