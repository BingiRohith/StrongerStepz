import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

/** Centered, max-width content wrapper — matches the legacy `.container` (92% width, 1200px cap). */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mx-auto w-[92%] max-w-[1200px] px-4", className)} {...props} />
  );
}
