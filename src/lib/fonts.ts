import { Open_Sans, Outfit } from "next/font/google";

/**
 * Heading typeface — matches the original static site's Google Fonts choice.
 * Exposed as a CSS variable so Tailwind's @theme can reference it.
 */
export const fontHeading = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

/**
 * Body typeface — matches the original static site's Google Fonts choice.
 */
export const fontBody = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-open-sans",
  display: "swap",
});
