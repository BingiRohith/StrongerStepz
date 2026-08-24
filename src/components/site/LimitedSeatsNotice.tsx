import { cn } from "@/utils/cn";

export interface LimitedSeatsNoticeProps {
  limitedSeatsEnabled: boolean;
  limitedSeats?: number | null;
  className?: string;
}

/**
 * Urgency nudge rendered directly under every Register/Join CTA. Hidden
 * entirely once `seatsAvailable` is false so a sold-out workshop never
 * shows a "hurry up" message alongside it.
 */
export function LimitedSeatsNotice({ limitedSeatsEnabled, limitedSeats, className }: LimitedSeatsNoticeProps) {
  if (!limitedSeatsEnabled || !limitedSeats) {
    return null;
  }

  return (
    <p className={cn("animate-seat-pulse text-center text-sm font-semibold text-red-600", className)}>
      <span aria-hidden="true">⚠</span> Hurry Up! Only {limitedSeats} Seats Available
    </p>
  );
}
