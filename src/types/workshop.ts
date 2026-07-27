/**
 * Shapes for the landing page's site-wide content — the sections that
 * aren't part of a specific Workshop document (challenge/problem callout,
 * audience & comparison, live stats bar). Workshop-specific content
 * (doctors, benefits, agenda, FAQ, pricing) now comes from
 * `@/models/Workshop` via `WorkshopService`, not from here.
 */

export interface ChallengeItem {
  icon: string;
  title: string;
  description: string;
}

export interface ComparisonColumn {
  title: string;
  items: string[];
  highlight?: boolean;
}

export interface WorkshopStats {
  registered: number;
  community: number;
}
