// The concept runs against a fixed "today" so the sample data stays coherent.
export const TODAY = new Date("2026-10-01T09:00:00Z");

const DAY = 24 * 60 * 60 * 1000;

export function parse(iso: string) {
  return new Date(`${iso}T09:00:00Z`);
}

export function daysUntil(iso: string, from: Date = TODAY) {
  return Math.round((parse(iso).getTime() - from.getTime()) / DAY);
}

export function addWorkingDays(iso: string, n: number) {
  const d = parse(iso);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return d.toISOString().slice(0, 10);
}

export function workingDaysBetween(fromIso: string, to: Date = TODAY) {
  const d = parse(fromIso);
  let count = 0;
  while (d < to) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6 && d <= to) count++;
  }
  return count;
}

export function formatDate(iso: string, opts: { year?: boolean } = { year: true }) {
  return parse(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(opts.year ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

export function relative(iso: string) {
  const d = daysUntil(iso);
  if (d === 0) return "today";
  if (d === 1) return "tomorrow";
  if (d === -1) return "yesterday";
  if (d < 0) return `${-d} days ago`;
  if (d < 14) return `in ${d} days`;
  if (d < 60) return `in ${Math.round(d / 7)} weeks`;
  return `in ${Math.round(d / 30)} months`;
}

export function gbp(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) {
    if (Math.abs(n) >= 1_000_000) return `£${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}m`;
    if (Math.abs(n) >= 1_000) return `£${Math.round(n / 1_000)}k`;
  }
  return n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
}

/** "7 days left", "Tomorrow", "Due today", "3 days late" */
export function daysLeft(days: number) {
  if (days < 0) return `${-days} days late`;
  if (days === 0) return "Due today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}
