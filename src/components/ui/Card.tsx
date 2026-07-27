import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

/** Base surface used across the site — plain white by default, or the brand's signature frosted-glass panel. */
export function Card({ className, glass = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-black/5 shadow-sm",
        glass
          ? "border-white/50 bg-white/70 shadow-md backdrop-blur-md"
          : "bg-white",
        className
      )}
      {...props}
    />
  );
}
