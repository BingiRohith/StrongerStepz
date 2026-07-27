"use client";

import { Loader } from "@/components/ui/Loader";
import { cn } from "@/utils/cn";

export interface ReorderControlsProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Up/down row reordering — no drag-and-drop dependency, since none exists
 * in the codebase today. Shared by any list that persists order via a
 * `displayOrder` field (Testimonials, Doctors) or an array position
 * (DynamicFieldListEditor).
 */
export function ReorderControls({
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
  disabled = false,
  loading = false,
  className,
}: ReorderControlsProps) {
  const isDisabled = disabled || loading;

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <button
        type="button"
        aria-label="Move up"
        onClick={onMoveUp}
        disabled={isDisabled || !canMoveUp}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-ink transition-colors hover:bg-surface-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">▲</span>
      </button>
      <button
        type="button"
        aria-label="Move down"
        onClick={onMoveDown}
        disabled={isDisabled || !canMoveDown}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-ink transition-colors hover:bg-surface-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span aria-hidden="true">▼</span>
      </button>
      {loading && <Loader size="sm" className="ml-1" />}
    </div>
  );
}
