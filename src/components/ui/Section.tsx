import type { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export type SectionBackground = "plain" | "light" | "dark";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  background?: SectionBackground;
}

const backgroundClasses: Record<SectionBackground, string> = {
  plain: "bg-surface text-ink",
  light: "bg-surface-light text-ink",
  dark: "bg-surface-dark text-white",
};

/** Full-width vertical rhythm wrapper — matches the legacy `.section` spacing (110px, 70px on mobile). */
export function Section({ className, background = "plain", ...props }: SectionProps) {
  return (
    <section
      className={cn("py-[70px] md:py-[110px]", backgroundClasses[background], className)}
      {...props}
    />
  );
}
