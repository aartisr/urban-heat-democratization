import type { ComponentProps, ReactNode } from "react";

type MotionProps = ComponentProps<"div"> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown };

function MotionDiv({ initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: MotionProps) {
  return <div {...props} />;
}

export const motion = { div: MotionDiv };
export function AnimatePresence({ children }: { children?: ReactNode; mode?: string }) { return <>{children}</>; }
