import type { ReactNode } from "react";

/** Generic prop shapes shared across the reusable UI layer. */

export interface WithChildren {
  children: ReactNode;
}

export interface WithClassName {
  className?: string;
}

export type Size = "sm" | "md" | "lg";

export type Variant = "primary" | "secondary" | "ghost" | "danger";
