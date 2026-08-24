import type { ReactNode } from "react";

type WorkflowHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
  actions?: ReactNode;
};

/** Shared accessible entry point for task-oriented pages. */
export function WorkflowHeader({ eyebrow, title, description, className = "", actions }: WorkflowHeaderProps) {
  return (
    <header className={`section-heading ${className}`.trim()}>
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
      </div>
      <details className="workflow-header-support">
        <summary>Why this page?</summary>
        <p>{description}</p>
        {actions ? <div className="workflow-header-actions">{actions}</div> : null}
      </details>
    </header>
  );
}
