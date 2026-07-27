const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

/** "June 28th" — matches the legacy site's badge copy (no year, ordinal day). */
export function formatWorkshopDate(date: Date): string {
  return `${MONTHS[date.getUTCMonth()]} ${ordinal(date.getUTCDate())}`;
}
