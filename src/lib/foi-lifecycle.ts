/**
 * Where an FOI request is in its life, whose move it is, and whether it's on pace for the 20 working days.
 * Decision record: docs/decisions/foi.md
 */
import { people, type FoiRequest } from "./data";
import { addWorkingDays, daysUntil, parse, workingDaysBetween } from "./dates";
import { foiCases } from "./foi-cases";

export type FoiStage = "received" | "searching" | "scope" | "draft" | "signoff" | "sent";

const stageOf: Record<FoiRequest["status"], FoiStage> = {
  New: "received",
  Searching: "searching",
  "Confirm scope": "scope",
  "Draft ready": "draft",
  "With reviewer": "signoff",
  Sent: "sent",
};
const order: FoiStage[] = ["received", "searching", "scope", "draft", "signoff", "sent"];

/** Target pace inside the 20 days: where a request should have got to by each working day */
export const milestones: { day: number; stage: FoiStage; label: string }[] = [
  { day: 3, stage: "scope", label: "Search done" },
  { day: 10, stage: "draft", label: "Draft ready" },
  { day: 16, stage: "signoff", label: "In sign-off" },
  { day: 20, stage: "sent", label: "Sent" },
];
function expected(day: number): FoiStage {
  return [...milestones].reverse().find((m) => day >= m.day)?.stage ?? "received";
}

export type Pace = "on-track" | "behind" | "overdue" | "done";
export type OwnerKind = "officer" | "contravo" | "reviewer" | "done";

export type FoiView = FoiRequest & {
  stage: FoiStage;
  elapsed: number;
  due: string;
  daysLeft: number;
  pace: Pace;
  expectedStage: FoiStage;
  owner: { kind: OwnerKind; name: string; id?: string };
  /** The one thing that happens next, in plain English */
  next: string;
  action: string;
  blockers: string[];
  checks: string[];
};

const REVIEWER = "sam"; // Information Governance lead signs off every reply

export function foiView(f: FoiRequest): FoiView {
  const stage = stageOf[f.status];
  const elapsed = workingDaysBetween(f.received);
  const due = addWorkingDays(f.received, 20);
  const daysLeft = daysUntil(due);
  const notes = foiCases[f.id]?.officerNotes ?? [];
  const drafted = stage === "draft" || stage === "signoff"; // issues with a draft only exist once there is one
  const blockers = drafted ? notes.filter((n) => n.severity === "block").map((n) => n.text) : [];
  const checks = drafted ? notes.filter((n) => n.severity === "check").map((n) => n.text) : [];
  const exp = expected(elapsed);
  const pace: Pace = stage === "sent" ? "done" : daysLeft < 0 ? "overdue" : order.indexOf(stage) < order.indexOf(exp) ? "behind" : "on-track";

  const officer = { kind: "officer" as const, name: people[f.assignee].name.replace(/^Dr /, ""), id: f.assignee };
  const byStage: Record<FoiStage, Pick<FoiView, "owner" | "next" | "action">> = {
    received: { owner: officer, next: "Read the request and start the search.", action: "Start search" },
    searching: { owner: { kind: "contravo", name: "Contravo" }, next: "Contravo is searching the register and contract documents.", action: "See what it’s found" },
    scope: { owner: officer, next: "Confirm which contracts the reply covers.", action: "Confirm scope" },
    draft: {
      owner: officer,
      next: blockers.length ? `Check the draft. ${blockers.length === 1 ? "One issue stops" : `${blockers.length} issues stop`} it being sent.` : "Check the draft reply and exemptions.",
      action: "Check draft",
    },
    signoff: { owner: { kind: "reviewer", name: people[REVIEWER].name, id: REVIEWER }, next: "Waiting for sign-off from the Information Governance lead.", action: "Open for sign-off" },
    sent: { owner: { kind: "done", name: "Done" }, next: `Sent on working day ${elapsed}.`, action: "View reply" },
  };

  return { ...f, stage, elapsed, due, daysLeft, pace, expectedStage: exp, blockers, checks, ...byStage[stage] };
}

export function dueText(v: FoiView) {
  if (v.stage === "sent") return `Sent on day ${v.elapsed}`;
  const d = v.daysLeft;
  if (d < 0) return `${-d} ${d === -1 ? "day" : "days"} overdue`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `${d} days left`;
}

/** "Fri 9 Oct": the date a target falls on for this request */
export function targetDate(v: FoiView, day: number) {
  return parse(addWorkingDays(v.received, day)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
