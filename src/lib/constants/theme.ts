/**
 * Brand tokens mirrored from the Tailwind theme (src/app/globals.css) for
 * contexts that can't consume CSS custom properties directly — chart
 * libraries, email templates, canvas/SVG drawing, etc. Tailwind classes
 * remain the source of truth for on-screen styling; keep this file in sync
 * if the palette ever changes.
 */
export const colors = {
  primary: "#2b5c4d",
  primaryLight: "#4a8c77",
  primaryDark: "#1b3d32",
  secondary: "#d19a62",
  secondaryLight: "#faeddf",
  ink: "#2d3748",
  inkMuted: "#4a5568",
  surface: "#fcfdfc",
  surfaceLight: "#f4f7f6",
  surfaceDark: "#1f2e28",
} as const;

export const fonts = {
  heading: "var(--font-heading)",
  body: "var(--font-body)",
} as const;

export const siteMeta = {
  name: "Stronger Steps",
  tagline: "Strength · Confidence · Independence",
} as const;
