// Throwaway: /proto/home data, shared by the variants. Deleted after the decision.
import { contracts, currentUser, decisions, foiRequests, people } from "@/lib/data";
import { daysUntil } from "@/lib/dates";
import { foiView } from "@/lib/foi-lifecycle";
import { events } from "@/lib/audit-trail";

export const me = currentUser.id;

export type Task = {
  id: string;
  kind: "decision" | "review" | "foi" | "gap";
  title: string;
  context: string;
  due: string | null;
  days: number | null;
  owner: string | null;
  amount?: number;
  action: string;
  href: string;
};

const decisionTasks: Task[] = decisions.map((d) => {
  const c = contracts.find((x) => x.id === d.contractId)!;
  return {
    id: d.id,
    kind: d.kind === "gap" ? "gap" : "decision",
    title: d.title,
    context: c.title,
    due: d.due,
    days: daysUntil(d.due),
    owner: d.owner,
    amount: d.impact?.amount,
    action: d.actions.primary,
    href: `/contracts/${c.id}`,
  };
});

/** Contracts the AI has read that a person still has to check: the live platform's "details to check" */
export const toReview = contracts.filter((c) => c.extraction === "Ready to review");
export const reading = contracts.filter((c) => c.extraction === "Reading");
const reviewTasks: Task[] = toReview.map((c) => ({
  id: `review-${c.id}`,
  kind: "review",
  title: "Check what the AI read before this contract goes live",
  context: c.title,
  due: null,
  days: null,
  owner: c.owner,
  action: "Check the details",
  href: `/contracts/${c.id}/review`,
}));

export const foi = foiRequests.map(foiView).filter((v) => v.stage !== "sent");
const foiTasks: Task[] = foi.map((v) => ({
  id: v.id,
  kind: "foi",
  title: v.next,
  context: `${v.subject} · ${v.ref}`,
  due: v.due,
  days: v.daysLeft,
  owner: v.owner.kind === "contravo" ? null : (v.owner.id ?? null),
  action: v.action,
  href: `/foi/${v.id}`,
}));

export const tasks: Task[] = [...decisionTasks, ...reviewTasks, ...foiTasks].sort(
  (a, b) => (a.days ?? 999) - (b.days ?? 999),
);

/** Contravo's own work since yesterday morning */
export const sinceYesterday = events.filter((e) => e.at >= "2026-09-30T06:00:00Z" && (e.who === "system" || e.kind === "uploaded" || e.kind === "foi")).slice(0, 6);

export const active = contracts.filter((c) => c.status === "Active");
export const annual = active.filter((c) => c.currency !== "USD").reduce((s, c) => s + (c.annualValue ?? 0), 0);
export const committing = decisions.filter((d) => d.kind === "notice" && daysUntil(d.due) <= 31).reduce((s, d) => s + (d.impact?.amount ?? 0), 0);
export const recoverable = decisions.filter((d) => d.kind === "money").reduce((s, d) => s + (d.impact?.amount ?? 0), 0);
export const priceRises = decisions.filter((d) => d.kind === "price").reduce((s, d) => s + (d.impact?.amount ?? 0), 0);

export const gaps = {
  noValue: contracts.filter((c) => c.annualValue == null).length,
  noSupplier: contracts.filter((c) => !c.supplier).length,
  noOwner: contracts.filter((c) => !c.owner).length,
  partial: contracts.filter((c) => c.pages.total != null && c.pages.held < c.pages.total).length,
};
export const reviewed = contracts.filter((c) => c.extraction === "Reviewed").length;

/** Next 12 months of ends and notice dates, by month */
export const months = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(Date.UTC(2026, 9 + i, 1));
  const key = d.toISOString().slice(0, 7);
  const ending = active.filter((c) => c.end.slice(0, 7) === key);
  return {
    key,
    label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }),
    year: d.getUTCMonth() === 0 ? String(d.getUTCFullYear()) : undefined,
    ending,
    value: ending.reduce((s, c) => s + (c.annualValue ?? 0), 0),
  };
});

export const team = Object.values(people)
  .map((p) => {
    const mine = tasks.filter((t) => t.owner === p.id);
    return { p, open: mine.length, soon: mine.filter((t) => t.days != null && t.days <= 7).length, overdue: mine.filter((t) => t.days != null && t.days < 0).length };
  })
  .filter((r) => r.open > 0)
  .sort((a, b) => b.open - a.open);
