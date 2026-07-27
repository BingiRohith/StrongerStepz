import { cn } from "@/utils/cn";
import type { Size } from "@/types/common";

export interface LoaderProps {
  size?: Size;
  className?: string;
  label?: string;
}

const sizeClasses: Record<Size, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-[3px]",
  lg: "h-12 w-12 border-4",
};

/** Spinning ring indicator for async/loading states. */
export function Loader({ size = "md", className, label = "Loading" }: LoaderProps) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block animate-spin rounded-full border-primary-light/30 border-t-primary",
        sizeClasses[size],
        className
      )}
    />
  );
}
