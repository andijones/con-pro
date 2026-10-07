// Throwaway: /proto/timeline shared data. Every contract on the timeline, with what the variants need to know.
import { contracts, type Contract } from "@/lib/data";
import { TODAY, daysUntil, parse } from "@/lib/dates";
import { noticeBy } from "@/lib/derive";

export type State = "now" | "soon" | "later" | "missed" | "ended";
export type Row = Contract & { nb: string; dn: number; value: number; renewEnd: string | null; state: State };

const DAY = 86_400_000;
export const addMonths = (iso: string, m: number) => {
  const d = parse(iso);
  d.setUTCMonth(d.getUTCMonth() + m);
  return d.toISOString().slice(0, 10);
};

export const rows: Row[] = contracts
  .filter((c) => c.status !== "Draft")
  .map((c) => {
    const nb = noticeBy(c);
    const dn = daysUntil(nb);
    const ended = parse(c.end) < TODAY || ["Terminated", "Expired", "Archived"].includes(c.status);
    const live = c.status === "Active";
    const state: State = ended ? "ended" : !live ? "later" : dn < 0 ? "missed" : dn <= 90 ? "now" : dn <= 365 ? "soon" : "later";
    // Money totals count sterling only, like the rest of the app (the one dollar contract is shown, not summed)
    return { ...c, nb, dn, value: c.currency === "USD" ? 0 : (c.annualValue ?? 0), renewEnd: c.autoRenew ? addMonths(c.end, c.autoRenew.months) : null, state };
  })
  .sort((a, b) => a.nb.localeCompare(b.nb));

export const groups: { key: State; label: string; hint: string }[] = [
  { key: "missed", label: "Notice window missed", hint: "Still running, but it’s too late to give notice in time." },
  { key: "now", label: "Decide now", hint: "The notice deadline is within 90 days." },
  { key: "soon", label: "Coming up", hint: "Notice deadline within a year." },
  { key: "later", label: "Later", hint: "Nothing to decide for over a year, or not started yet." },
  { key: "ended", label: "Ended", hint: "Finished, terminated or archived." },
];

/** A linear time scale between two ISO dates, as percentages */
export function scale(fromIso: string, toIso: string) {
  const a = parse(fromIso).getTime();
  const b = parse(toIso).getTime();
  const raw = (iso: string) => ((parse(iso).getTime() - a) / (b - a)) * 100;
  return { raw, pct: (iso: string) => Math.max(0, Math.min(100, raw(iso))), a, b, days: (b - a) / DAY };
}

/** Month starts between two dates, for ticks */
export function monthsBetween(fromIso: string, toIso: string) {
  const out: string[] = [];
  const d = parse(fromIso);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  while (d <= parse(toIso)) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return out;
}

export const todayIso = TODAY.toISOString().slice(0, 10);
export const monthLabel = (iso: string, opts: Intl.DateTimeFormatOptions = { month: "short" }) => parse(iso).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
