import { Container } from "@/components/ui/Container";
import type { WorkshopStats } from "@/types/workshop";

export interface LiveStatsBarProps {
  stats: WorkshopStats;
  registeredLabel: string;
  communityLabel: string;
}

/**
 * The legacy site polled a Google Apps Script for these numbers on every
 * page load. For now they're static mock values — Phase 4 swaps this for a
 * real `/api/stats` call without changing this component's props.
 */
export function LiveStatsBar({ stats, registeredLabel, communityLabel }: LiveStatsBarProps) {
  return (
    <div className="border-t border-white/10 bg-surface-dark py-5 text-white">
      <Container className="flex flex-col justify-center gap-6 text-center sm:flex-row sm:gap-10">
        <div>
          <span className="block font-heading text-3xl font-extrabold text-secondary tabular-nums md:text-4xl">
            {stats.registered}
          </span>
          <span className="text-sm font-semibold tracking-wide text-white/60 uppercase">{registeredLabel}</span>
        </div>
        <div>
          <span className="block font-heading text-3xl font-extrabold text-secondary tabular-nums md:text-4xl">
            {stats.community}
          </span>
          <span className="text-sm font-semibold tracking-wide text-white/60 uppercase">{communityLabel}</span>
        </div>
      </Container>
    </div>
  );
}
