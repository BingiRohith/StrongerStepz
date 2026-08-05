import { cn } from "@/utils/cn";

export interface LimitedSeatsNoticeProps {
  seatsAvailable: boolean;
  className?: string;
}

/**
 * Urgency nudge rendered directly under every Register/Join CTA. Hidden
 * entirely once `seatsAvailable` is false so a sold-out workshop never
 * shows a "hurry up" message alongside it.
 */
export function LimitedSeatsNotice({ seatsAvailable, className }: LimitedSeatsNoticeProps) {
  if (!seatsAvailable) {
    return null;
  }

  return (
    <p className={cn("animate-seat-pulse text-center text-sm font-semibold text-red-600", className)}>
      <span aria-hidden="true">⚠</span> Hurry Up! Limited Seats Available
    </p>
  );
}
