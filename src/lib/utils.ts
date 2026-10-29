

export function generatePassword(user: { firstName: string; lastName: string }) {
  return `${user.firstName.trim()}-${user.lastName.trim()}`.toLowerCase();
}

const TZ_OFFSET_HOURS = 8; // UTC+8, no daylight saving
const HOUR_MS = 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * HOUR_MS;

export function startOfWeek(input: Date = new Date()): Date {
  const local = new Date(input.getTime() + TZ_OFFSET_HOURS * HOUR_MS);
  local.setUTCHours(0, 0, 0, 0);
  local.setUTCDate(local.getUTCDate() - ((local.getUTCDay() + 6) % 7)); // back to Monday
  return new Date(local.getTime() - TZ_OFFSET_HOURS * HOUR_MS);
}

export function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * WEEK_MS);
}

export function startOfDay(input: Date = new Date()): Date {
  const local = new Date(input.getTime() + TZ_OFFSET_HOURS * HOUR_MS);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - TZ_OFFSET_HOURS * HOUR_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * HOUR_MS);
}


// percentage (0-100) of the start-to-end range that has elapsed at `now`
export function elapsedPercent(start: Date, end: Date, now: Date = new Date()): number {
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  return Math.round(Math.min(Math.max((now.getTime() - start.getTime()) / total, 0), 1) * 100);
}
