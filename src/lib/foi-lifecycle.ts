/**
 * Where an FOI request is in its life, whose move it is, and whether it's on pace for the 20 working days.
 * Decision record: docs/decisions/foi.md
 */
import { people, type FoiRequest } from "./data";
import { addWorkingDays, parse, workingDaysBetween } from "./dates";
import { foiCases } from "./foi-cases";

/** "clarify" sits outside the pace order: the clock is stopped until the requester replies */
export type FoiStage = "received" | "searching" | "clarify" | "scope" | "draft" | "signoff" | "sent";

const stageOf: Record<FoiRequest["status"], FoiStage> = {
  New: "received",
  Searching: "searching",
  "Awaiting clarification": "clarify",
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

export type Pace = "on-track" | "behind" | "overdue" | "paused" | "done";
export type OwnerKind = "officer" | "contravo" | "reviewer" | "requester" | "done";

export type FoiView = FoiRequest & {
  stage: FoiStage;
  /** Working days used: up to today, or to the day it was sent, or to the day clarification was asked */
  elapsed: number;
  due: string;
  /** Working days left (negative once overdue). The Act counts working days, so the app does too. */
  workingLeft: number;
  pace: Pace;
  expectedStage: FoiStage;
  owner: { kind: OwnerKind; name: string; id?: string };
  /** The one thing that happens next, in plain English */
  next: string;
  action: string;
  blockers: string[];
  checks: string[];
};

export function foiView(f: FoiRequest): FoiView {
  const stage = stageOf[f.status];
  // The clock runs to today, or stops on the day the reply went out or clarification was asked
  const stoppedOn = f.sentOn ?? (stage === "clarify" ? f.clarifyAsked : undefined);
  const elapsed = workingDaysBetween(f.received, stoppedOn ? parse(stoppedOn) : undefined);
  const due = addWorkingDays(f.received, 20);
  const workingLeft = 20 - elapsed;
  const notes = foiCases[f.id]?.officerNotes ?? [];
  const drafted = stage === "draft" || stage === "signoff"; // issues with a draft only exist once there is one
  const blockers = drafted ? notes.filter((n) => n.severity === "block").map((n) => n.text) : [];
  const checks = drafted ? notes.filter((n) => n.severity === "check").map((n) => n.text) : [];
  const exp = expected(elapsed);
  const pace: Pace =
    stage === "sent" ? "done" : stage === "clarify" ? "paused" : workingLeft < 0 ? "overdue" : order.indexOf(stage) < order.indexOf(exp) ? "behind" : "on-track";

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
    clarify: {
      owner: { kind: "requester", name: "The requester" },
      next: "Waiting for the requester to clarify. The clock is stopped.",
      action: "Record their reply",
    },
    signoff: {
      owner: { kind: "reviewer", name: people[f.reviewer].name.replace(/^Dr /, ""), id: f.reviewer },
      next: `Waiting for sign-off from ${people[f.reviewer].name}, ${people[f.reviewer].role}.`,
      action: "Open for sign-off",
    },
    sent: { owner: { kind: "done", name: "Done" }, next: `Sent on working day ${elapsed}.`, action: "View reply" },
  };

  return { ...f, stage, elapsed, due, workingLeft, pace, expectedStage: exp, blockers, checks, ...byStage[stage] };
}

/** Time left in working days: "10 working days left", "Due today", "2 working days overdue" */
export function dueText(v: FoiView) {
  if (v.stage === "sent") return `Sent on day ${v.elapsed}`;
  if (v.stage === "clarify") return "Clock stopped";
  const d = v.workingLeft;
  if (d < 0) return `${-d} working ${d === -1 ? "day" : "days"} overdue`;
  if (d === 0) return "Due today";
  return `${d} working ${d === 1 ? "day" : "days"} left`;
}

/** Sorting: least time left first; requests with the clock stopped go last */
export const timeLeft = (v: FoiView) => (v.stage === "clarify" ? 999 : v.workingLeft);

/** Separation of duties: the officer who drafted a reply can't sign it off */
export const canSignOff = (f: FoiRequest, personId: string) => personId !== f.assignee;

/** "Fri 9 Oct": the date a target falls on for this request */
export function targetDate(v: FoiView, day: number) {
  return parse(addWorkingDays(v.received, day)).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
