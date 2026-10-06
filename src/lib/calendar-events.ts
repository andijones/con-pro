/**
 * Dated events for the Home calendar: notice deadlines, contract ends, price-rise and money deadlines, FOI replies.
 * Component: components/contravo/mini-calendar.tsx. Decision record: docs/decisions/home.md
 */
import { contracts, decisions, foiRequests } from "./data";
import { daysUntil } from "./dates";
import { foiDue, noticeBy } from "./derive";

export type Kind = "notice" | "ends" | "money" | "foi";
export type CalendarEvent = { id: string; date: string; kind: Kind; title: string; context: string; href: string };

/** Shape + colour per kind, so colour is never the only signal (WCAG 1.4.1). Most urgent first. */
export const kinds: Record<Kind, { label: string; rank: number; tint: string }> = {
  notice: { label: "Notice deadline", rank: 0, tint: "bg-warning-muted" },
  money: { label: "Price rise or money deadline", rank: 1, tint: "bg-success-muted" },
  foi: { label: "FOI reply due", rank: 2, tint: "bg-highlight" },
  ends: { label: "Contract ends", rank: 3, tint: "bg-muted" },
};

const live = contracts.filter((c) => c.status === "Active");
const title = (id: string) => contracts.find((c) => c.id === id)?.title ?? id;

export const events: CalendarEvent[] = [
  ...live
    .filter((c) => c.autoRenew || c.notice > 0)
    .map((c) => ({ id: `n-${c.id}`, date: noticeBy(c), kind: "notice" as const, title: c.autoRenew ? "Give notice or it renews" : "Last day to give notice", context: c.title, href: `/contracts/${c.id}` })),
  ...live.map((c) => ({ id: `e-${c.id}`, date: c.end, kind: "ends" as const, title: c.autoRenew ? "Term ends, renews if no notice" : "Contract ends", context: c.title, href: `/contracts/${c.id}` })),
  ...decisions
    .filter((d) => d.kind === "price" || d.kind === "money")
    .map((d) => ({ id: `m-${d.id}`, date: d.due, kind: "money" as const, title: d.title, context: title(d.contractId), href: `/contracts/${d.contractId}` })),
  ...foiRequests
    .filter((f) => f.status !== "Sent")
    .map((f) => ({ id: `f-${f.id}`, date: foiDue(f), kind: "foi" as const, title: "FOI reply due", context: `${f.subject} · ${f.ref}`, href: `/foi/${f.id}` })),
]
  .filter((e) => daysUntil(e.date) >= -1)
  .sort((a, b) => a.date.localeCompare(b.date) || kinds[a.kind].rank - kinds[b.kind].rank);

export const byDate = (iso: string) => events.filter((e) => e.date === iso);

/** Monday-first grid for a month: ISO dates, with null padding */
export function monthGrid(year: number, month: number) {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(new Date(Date.UTC(year, month, d)).toISOString().slice(0, 10));
  while (cells.length % 7) cells.push(null);
  return cells;
}

export const monthLabel = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
export const dayLabel = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
