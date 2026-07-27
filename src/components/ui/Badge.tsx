import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type BadgeVariant = "primary" | "secondary" | "outline";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: "bg-primary text-white",
  secondary: "bg-secondary text-white",
  outline: "border border-white/20 bg-white/10 text-inherit backdrop-blur-sm",
};

/** Pill label — matches the legacy `.badge` / `.tag` treatment. */
export function Badge({ className, variant = "secondary", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-5 py-2 font-heading text-sm font-bold tracking-wide uppercase",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
