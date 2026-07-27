import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Placeholder shown where a table/list would otherwise render — no data yet, or nothing matched a filter. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center",
        className
      )}
    >
      {icon && <div className="text-4xl text-ink-muted">{icon}</div>}
      <h3 className="font-heading text-xl text-primary-dark">{title}</h3>
      {description && <p className="max-w-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
