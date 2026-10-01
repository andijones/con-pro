import { addWorkingDays, daysUntil, parse, workingDaysBetween } from "./dates";
import { contracts, decisions, type Contract, type FoiRequest } from "./data";

export function noticeBy(c: Contract) {
  const d = parse(c.end);
  d.setUTCDate(d.getUTCDate() - c.notice);
  return d.toISOString().slice(0, 10);
}

/** The next date that matters on a contract: the notice deadline if still ahead, else the end date. */
export function nextDeadline(c: Contract): { date: string; label: string } {
  const nb = noticeBy(c);
  if (c.status === "Draft") return { date: c.start, label: "Starts" };
  if (daysUntil(nb) >= 0) return { date: nb, label: c.autoRenew ? "Notice or it renews" : "Notice by" };
  return { date: c.end, label: "Ends" };
}

export function decisionsFor(contractId: string) {
  return decisions.filter((d) => d.contractId === contractId);
}

export function foiDue(f: FoiRequest) {
  return addWorkingDays(f.received, 20);
}

export function foiElapsed(f: FoiRequest) {
  return workingDaysBetween(f.received);
}

export function urgency(days: number): "overdue" | "urgent" | "soon" | "later" {
  if (days < 0) return "overdue";
  if (days <= 7) return "urgent";
  if (days <= 30) return "soon";
  return "later";
}

export function estateTotals() {
  const live = contracts.filter((c) => c.status === "Active");
  const gbpAnnual = live
    .filter((c) => c.currency !== "USD" && c.annualValue)
    .reduce((s, c) => s + (c.annualValue ?? 0), 0);
  return { count: contracts.length, live: live.length, gbpAnnual };
}
