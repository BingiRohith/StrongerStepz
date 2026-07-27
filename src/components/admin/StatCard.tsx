import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/utils/cn";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
}

/** One dashboard tile — a label, a large value, and an optional supporting hint. */
export function StatCard({ label, value, hint, className }: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <p className="mb-2 font-heading text-xs font-bold tracking-wide text-ink-muted uppercase">{label}</p>
      <p className="font-heading text-3xl font-extrabold text-primary-dark tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
    </Card>
  );
}
