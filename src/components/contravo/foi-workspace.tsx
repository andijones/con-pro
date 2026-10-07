"use client";

import { useState } from "react";
import Link from "next/link";
import { cn as clsx } from "@/lib/utils";
import {
  AlertOctagon,
  CalendarIcon,
  Check,
  CircleAlert,
  CirclePause,
  MailCheck,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Quote,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type { FoiRequest } from "@/lib/data";
import { contracts, organisation, people } from "@/lib/data";
import type { FoiCase } from "@/lib/foi-cases";
import { addWorkingDays, formatDate, gbp, parse, TODAY } from "@/lib/dates";
import { canSignOff, dueText, foiView } from "@/lib/foi-lifecycle";
import { restoreFoi, updateFoi, useFoiPatches, withPatch, type FoiPatch } from "@/lib/foi-store";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./primitives";

type Stage = "request" | "searching" | "scope" | "draft";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const todayIso = iso(TODAY);

function initialStage(status: FoiRequest["status"]): Stage {
  if (status === "New" || status === "Awaiting clarification") return "request";
  if (status === "Searching" || status === "Confirm scope") return "scope";
  return "draft";
}

/** Change a request, with an Undo that puts it back exactly as it was (WCAG 2.2.1: no time limit) */
function change(id: string, patch: FoiPatch, before: FoiPatch | undefined, message: string, description?: string) {
  updateFoi(id, patch);
  toast(message, { description, action: { label: "Undo", onClick: () => restoreFoi(id, before) }, duration: Infinity });
}

export function FoiWorkspace({ req: seed, kase }: { req: FoiRequest; kase: FoiCase }) {
  // This session's changes (clarify, sign-off, sent) applied on top of the stored request
  const patches = useFoiPatches();
  const req = withPatch(seed, patches);
  const v = foiView(req);
  const before = patches[seed.id];
  const [stage, setStage] = useState<Stage>(initialStage(req.status));
  const [shown, setShown] = useState(stage === "request" ? 0 : kase.searches.length);
  const [scope, setScope] = useState<string[]>(kase.proposed);
  const [resolved, setResolved] = useState<number[]>([]);

  const blocking = kase.officerNotes.filter((n, i) => n.severity === "block" && !resolved.includes(i)).length;
  const scoped = contracts.filter((c) => scope.includes(c.id));
  const withheldIds = new Set(
    Object.entries(kase.valueHeld ?? {})
      .filter(([, v]) => v.value === "Withheld")
      .map(([k]) => k),
  );

  function runSearch() {
    setStage("searching");
    kase.searches.forEach((_, i) => setTimeout(() => setShown(i + 1), 700 * (i + 1)));
    setTimeout(() => setStage("scope"), 700 * (kase.searches.length + 1));
  }

  const steps: { key: Stage | "searching"; label: string }[] = [
    { key: "request", label: "Request" },
    { key: "searching", label: "Searches" },
    { key: "scope", label: "Scope" },
    { key: "draft", label: "Draft response" },
  ];
  const order = ["request", "searching", "scope", "draft"];
  const at = order.indexOf(stage);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        {/* Step indicator */}
        <ol className="mb-6 flex flex-wrap items-center gap-2 text-caption">
          {steps.map((s, i) => {
            const done = i < at || (stage === "draft" && i === 3);
            const current = i === at;
            return (
              <li key={s.key} className="flex items-center gap-2">
                <span
                  className={clsx(
                    "tnum grid size-6 place-items-center rounded-full text-micro font-medium",
                    done ? "bg-primary text-white" : current ? "bg-highlight text-primary ring-1 ring-ring" : "bg-card text-muted-foreground ring-1 ring-border",
                  )}
                >
                  {done ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span className={clsx(current || done ? "text-foreground" : "text-muted-foreground", current && "font-medium")}>{s.label}</span>
                {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-input" aria-hidden />}
              </li>
            );
          })}
        </ol>

        {/* 1. Request */}
        <Card className="gap-0 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium">Request</h2>
            <span className="tnum text-xs text-muted-foreground">
              {req.requester} · received {formatDate(seed.received)}
              {req.received !== seed.received && <> · clock restarted {formatDate(req.received)}</>}
            </span>
          </div>
          <blockquote className="mt-3 border-l-2 border-ring pl-4 text-base leading-relaxed text-pretty">{req.text}</blockquote>
          {stage === "request" && (
            <div className="mt-5 flex items-center gap-3">
              <Button onClick={runSearch}>
                <Search size={14} aria-hidden /> Find contracts
              </Button>
              <span className="text-xs text-muted-foreground">Searches the register and the text of every contract</span>
            </div>
          )}
        </Card>

        {/* 2. Searches */}
        {stage !== "request" && (
          <Card className="gap-0 mt-4 p-5">
            <h2 className="text-sm font-medium">
              Searches <span className="font-normal text-muted-foreground">· reworded each time to catch different phrasing</span>
            </h2>
            <ul className="mt-3 divide-y divide-border">
              {kase.searches.map((s, i) => {
                const done = i < shown;
                const running = stage === "searching" && i === shown;
                if (!done && !running) return null;
                return (
                  <li key={s.query} className="flex items-center gap-3 py-2.5 text-sm">
                    {done ? (
                      <Check size={14} className="shrink-0 text-success" aria-hidden />
                    ) : (
                      <Loader2 size={14} className="shrink-0 animate-spin text-primary" aria-hidden />
                    )}
                    <span className="flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-micro text-muted-foreground">
                      {s.where === "Register" ? <Database size={11} aria-hidden /> : <FileText size={11} aria-hidden />}
                      {s.where}
                    </span>
                    <code className="min-w-0 flex-1 truncate font-sans text-foreground/80">{s.query}</code>
                    <span className="tnum shrink-0 text-xs text-muted-foreground">
                      {done ? `${s.found} ${s.found === 1 ? "contract" : "contracts"}` : "searching"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {/* 3. Scope */}
        {(stage === "scope" || stage === "draft") && (
          <Card className="gap-0 mt-4 p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-medium">Scope</h2>
              <span className="text-xs text-muted-foreground">
                {stage === "draft" ? "Confirmed by " + people[req.assignee].name : "You choose which contracts the reply covers"}
              </span>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {kase.proposed.map((id) => {
                const c = contracts.find((x) => x.id === id)!;
                const on = scope.includes(id);
                return (
                  <li key={id}>
                    <label
                      className={clsx(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-[background-color,box-shadow] duration-(--duration-fast)",
                        on ? "bg-highlight/40 shadow-[0_0_0_1px_color-mix(in_oklab,var(--ring)_55%,transparent)]" : "shadow-xs hover:bg-muted/60",
                        stage === "draft" && "pointer-events-none",
                      )}
                    >
                      <Checkbox
                        checked={on}
                        disabled={stage === "draft"}
                        onCheckedChange={() => setScope((s) => (on ? s.filter((x) => x !== id) : [...s, id]))}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{c.title}</span>
                        <span className="block truncate text-xs text-muted-foreground">{c.supplier ?? "No supplier recorded"}</span>
                      </span>
                      <StatusBadge status={c.status} />
                    </label>
                  </li>
                );
              })}
            </ul>
            {kase.excluded?.map((e) => {
              const c = contracts.find((x) => x.id === e.id)!;
              return (
                <p key={e.id} className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Left out: {c.title}.</span> {e.reason}.
                </p>
              );
            })}
            <div className="mt-4 flex gap-2">
              {stage === "scope" ? (
                <Button disabled={!scope.length} onClick={() => setStage("draft")}>
                  Confirm {scope.length} {scope.length === 1 ? "contract" : "contracts"} and draft
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setStage("scope")}>Change scope and redraft</Button>
              )}
            </div>
          </Card>
        )}

        {/* 4. Draft */}
        {stage === "draft" && (
          <div className="mt-4 overflow-hidden rounded-lg bg-card shadow-card">
            <div className="flex items-center gap-2 border-b border-warning/25 bg-warning-muted px-5 py-2.5 text-caption font-medium text-warning">
              <CircleAlert size={14} aria-hidden /> Draft only. Not a decision of the authority.
            </div>
            <article className="px-5 py-6 sm:px-8">
              <p className="tnum text-xs text-muted-foreground">
                {req.ref} · {organisation.name}
              </p>
              <h2 className="heading mt-1 text-2xl">Response to your request</h2>
              <p className="mt-3 max-w-[65ch] text-reading leading-relaxed text-muted-foreground">
                Thank you for your request of {formatDate(seed.received)} under the Freedom of Information Act 2000. We have set out
                below what we hold, what we can disclose and what we have withheld.
              </p>

              <DraftSection n={1} title="Information held">
                <p>
                  We searched the trust’s contract register and the text of {contracts.length} contract documents. We found{" "}
                  {scoped.length} {scoped.length === 1 ? "contract" : "contracts"} within the scope of your request.
                </p>
                {kase.notSearched.length > 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Not searched:</span> {kase.notSearched.join(", ").toLowerCase()}.
                  </p>
                )}
              </DraftSection>

              <DraftSection n={2} title="Information disclosed">
                <div className="-mx-1 overflow-x-auto" tabIndex={0} role="region" aria-label="Schedule of information disclosed">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="px-1 py-2 font-medium">Contract</th>
                        <th className="px-2 py-2 font-medium">Supplier</th>
                        <th className="px-2 py-2 font-medium">Ends</th>
                        <th className="px-2 py-2 font-medium">Value held</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoped.map((c) => {
                        const held = kase.valueHeld?.[c.id];
                        const conflict = held && held.value !== "Withheld";
                        return (
                          <tr key={c.id} className="border-b border-border last:border-0 align-top">
                            <td className="px-1 py-2.5 font-medium">{c.title}</td>
                            <td className="px-2 py-2.5">{c.supplier ?? <span className="text-warning">Not recorded</span>}</td>
                            <td className="tnum px-2 py-2.5">{formatDate(c.end)}</td>
                            <td className="tnum px-2 py-2.5">
                              {held ? (
                                <span className={conflict ? "text-critical" : "text-muted-foreground"}>
                                  {held.value}
                                  <span className="block text-xs">{held.source}</span>
                                </span>
                              ) : c.annualValue ? (
                                <>
                                  {c.currency === "USD" ? `$${c.annualValue.toLocaleString("en-GB")}` : gbp(c.annualValue)} a year
                                  <span className="block text-xs text-muted-foreground">From the signed contract</span>
                                </>
                              ) : c.totalValue ? (
                                <>
                                  {gbp(c.totalValue)} total
                                  <span className="block text-xs text-warning">Annual value not held</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground">Not held</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {withheldIds.size > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">Rows marked “Withheld” are explained in section 3.</p>
                )}
              </DraftSection>

              <DraftSection n={3} title="Information withheld">
                {kase.withheld?.length ? (
                  <ul className="flex flex-col gap-2">
                    {kase.withheld.map((w) => (
                      <li key={w.what}>
                        <span className="font-medium">{w.what}:</span> withheld under {w.exemption}. {w.reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No information has been withheld.</p>
                )}
              </DraftSection>

              {kase.advice.length > 0 && (
                <DraftSection n={4} title="Advice and assistance (section 16)">
                  <ul className="flex list-disc flex-col gap-2 pl-4">
                    {kase.advice.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                </DraftSection>
              )}

              <p className="mt-8 max-w-[65ch] text-sm leading-relaxed text-muted-foreground">
                If you are unhappy with this response you can ask for an internal review within 40 working days. If you are still
                unhappy, you can complain to the Information Commissioner’s Office.
              </p>
            </article>
          </div>
        )}
      </div>

      {/* Right rail: the clock, what blocks sending, outputs */}
      <aside className="order-first flex flex-col gap-4 lg:sticky lg:top-(--page-bar-offset) lg:order-none lg:self-start">
        <Clock req={req} v={v} kase={kase} before={before} onReplied={() => setStage(kase.searches.length ? "scope" : "request")} />

        {stage === "draft" && kase.officerNotes.length > 0 && (
          <Card className="gap-0 p-5">
            <h2 className="flex items-center justify-between text-sm font-medium">
              Notes for the reviewing officer
              {blocking > 0 ? (
                <span className="tnum text-xs font-medium text-critical">{blocking} blocking</span>
              ) : (
                <span className="text-xs font-medium text-success">Nothing blocking</span>
              )}
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {kase.officerNotes.map((n, i) => {
                const done = resolved.includes(i);
                return (
                  <li
                    key={i}
                    className={clsx(
                      "rounded-lg p-3 text-caption leading-relaxed transition-opacity",
                      n.severity === "block" ? "bg-critical-muted/60 shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--critical)_22%,transparent)]" : "bg-muted/60",
                      done && "opacity-55",
                    )}
                  >
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      {n.severity === "block" ? (
                        <AlertOctagon size={12} className="text-critical" aria-hidden />
                      ) : (
                        <CircleAlert size={12} className="text-warning" aria-hidden />
                      )}
                      {n.severity === "block" ? "Resolve before sending" : "Check"}
                    </p>
                    <p className="mt-1">{n.text}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      {n.contractId && (
                        <Link href={`/contracts/${n.contractId}`} className="font-medium text-primary hover:underline">
                          Open contract
                        </Link>
                      )}
                      <button
                        onClick={() => setResolved((r) => (done ? r.filter((x) => x !== i) : [...r, i]))}
                        className="font-medium text-muted-foreground hover:text-foreground"
                      >
                        {done ? "Reopen" : "Mark resolved"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        {stage === "draft" && (
          <Card className="gap-0 p-5">
            <h2 className="text-sm font-medium">Outputs</h2>
            <ul className="mt-3 flex flex-col gap-1">
              {[
                { icon: FileText, label: "Draft letter", meta: "PDF" },
                { icon: FileSpreadsheet, label: "Schedule", meta: "CSV" },
                { icon: Quote, label: "Passages the draft drew on", meta: `${scoped.length * 2} extracts` },
              ].map((o) => (
                <li key={o.label}>
                  <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-muted">
                    <o.icon size={15} className="text-muted-foreground" aria-hidden />
                    <span className="flex-1">{o.label}</span>
                    <span className="text-xs text-muted-foreground">{o.meta}</span>
                    <Download size={13} className="text-muted-foreground" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            <SignOff req={req} blocking={blocking} before={before} />
          </Card>
        )}
      </aside>
    </div>
  );
}

function DraftSection({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h3 className="flex items-baseline gap-2 text-base font-medium">
        <span className="tnum text-sm text-muted-foreground">{n}.</span>
        {title}
      </h3>
      <div className="mt-2 max-w-[70ch] text-reading leading-relaxed">{children}</div>
    </section>
  );
}

/* ---------- The clock: running, stopped for clarification, or stopped because the reply was sent ---------- */

type V = ReturnType<typeof foiView>;

function Clock({ req, v, kase, before, onReplied }: { req: FoiRequest; v: V; kase: FoiCase; before: FoiPatch | undefined; onReplied: () => void }) {
  if (v.stage === "clarify") {
    return (
      <Card className="gap-0 p-5">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CirclePause className="size-3.5" aria-hidden /> Clock stopped
        </p>
        <p className="mt-1 text-xl">Waiting for the requester</p>
        <p className="mt-2 text-sm text-pretty text-muted-foreground">
          Asked to clarify on {formatDate(req.clarifyAsked!)}, at working day {v.elapsed} of 20. The 20 working days start again from the day after
          they reply.
        </p>
        <RecordReply req={req} before={before} onReplied={onReplied} />
      </Card>
    );
  }
  if (v.stage === "sent") {
    const sent = req.sentOn ?? todayIso;
    return (
      <Card className="gap-0 p-5">
        <p className="text-xs text-muted-foreground">Sent</p>
        <p className="figure-md mt-1">{formatDate(sent)}</p>
        <p className="tnum mt-1.5 text-xs text-pretty text-muted-foreground">
          Working day {v.elapsed} of 20{v.elapsed > 20 ? ", after the legal deadline" : ""}. The requester can ask for an internal review until{" "}
          {formatDate(addWorkingDays(sent, 40))}.
        </p>
      </Card>
    );
  }
  return (
    <Card className="gap-0 p-5">
      <p className="text-xs text-muted-foreground">Response due</p>
      <p className="figure-md mt-1">{formatDate(v.due)}</p>
      <div className="mt-3 flex gap-[2px]" aria-hidden>
        {Array.from({ length: 20 }).map((_, i) => (
          <span
            key={i}
            className={clsx("h-2 flex-1 rounded-[1px]", i < v.elapsed ? (v.workingLeft <= 2 ? "bg-critical" : "bg-ring") : "bg-muted ring-1 ring-border ring-inset")}
          />
        ))}
      </div>
      <p className="tnum mt-1.5 text-xs text-muted-foreground">
        {v.elapsed === 0 ? "Day 1 is the next working day" : `Working day ${Math.min(v.elapsed, 20)} of 20`} · {dueText(v).replace(/^Due today$/, "due today")}
      </p>
      {v.stage !== "signoff" && <AskToClarify req={req} kase={kase} before={before} />}
    </Card>
  );
}

/** FOI Act s.1(3): an unclear request can be clarified; the clock stops, and restarts from the day after they reply */
function AskToClarify({ req, kase, before }: { req: FoiRequest; kase: FoiCase; before: FoiPatch | undefined }) {
  // A real question, with the agent's advice as the reason for asking
  const [question, setQuestion] = useState(
    `Thank you for your request. So that we can answer it fully, could you clarify exactly what information you are looking for?${kase.advice[0] ? `\n\nFor context: ${kase.advice[0]}` : ""}`,
  );
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-3 -ml-2.5 self-start text-muted-foreground">
          <CirclePause data-icon="inline-start" /> Ask the requester to clarify
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ask the requester to clarify</DialogTitle>
          <DialogDescription>
            If you can’t tell what they’re asking for, you can ask. The clock stops while you wait, and the 20 working days start again from the day
            after they reply (FOI Act, section 1(3)).
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="clarify-question">Your question</FieldLabel>
          <Textarea id="clarify-question" rows={5} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <FieldDescription>Drafted from the advice in the reply. Send it from your own mailbox, then confirm here.</FieldDescription>
        </Field>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard?.writeText(question).then(
                () => toast.success("Question copied"),
                () => toast.error("Couldn’t copy. Select the text and copy it instead."),
              );
            }}
          >
            Copy question
          </Button>
          <DialogClose asChild>
            <Button
              disabled={!question.trim()}
              onClick={() =>
                change(req.id, { status: "Awaiting clarification", clarifyAsked: todayIso }, before, "Clock stopped", "Waiting for the requester to clarify.")
              }
            >
              I’ve sent it. Stop the clock
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Their reply restarts the clock: day 1 is the working day after it arrived */
function RecordReply({ req, before, onReplied }: { req: FoiRequest; before: FoiPatch | undefined; onReplied: () => void }) {
  const [on, setOn] = useState<Date>(TODAY);
  return (
    <div className="mt-4 flex flex-col gap-2">
      <DatePick id="reply-date" label="Their reply arrived" value={on} onChange={setOn} from={parse(req.clarifyAsked ?? req.received)} />
      <Button
        className="w-full"
        onClick={() => {
          change(req.id, { status: "Confirm scope", received: iso(on), clarifyAsked: undefined }, before, "Clock restarted", `Day 1 is the working day after ${formatDate(iso(on))}.`);
          onReplied();
        }}
      >
        Record their reply
      </Button>
    </div>
  );
}

/* ---------- Sign-off: a named reviewer who isn't the drafter, then the date it went out ---------- */

function SignOff({ req, blocking, before }: { req: FoiRequest; blocking: number; before: FoiPatch | undefined }) {
  const [sentOn, setSentOn] = useState<Date>(TODAY);
  const reviewer = people[req.reviewer];
  const officer = people[req.assignee];

  if (req.status === "Sent") {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-lg bg-success-muted px-3 py-2.5 text-sm text-success">
        <MailCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          Sent on {formatDate(req.sentOn ?? todayIso)}.{req.approvedBy && <> Approved by {people[req.approvedBy].name}.</>}
        </span>
      </p>
    );
  }

  if (req.approvedBy) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <p className="flex items-center gap-1.5 text-sm text-success">
          <Check className="size-4" aria-hidden /> Approved by {people[req.approvedBy].name}
        </p>
        <DatePick id="sent-date" label="Date sent" value={sentOn} onChange={setSentOn} from={parse(req.received)} />
        <Button
          className="w-full"
          onClick={() => change(req.id, { status: "Sent", sentOn: iso(sentOn) }, before, "Marked as sent", "The clock has stopped and the request has moved to Sent.")}
        >
          <MailCheck data-icon="inline-start" /> Mark as sent
        </Button>
        <p className="text-center text-xs text-pretty text-muted-foreground">Send it from your own mailbox first. This records the date and stops the clock.</p>
      </div>
    );
  }

  if (req.status === "With reviewer") {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          With <span className="font-medium text-foreground">{reviewer.name}</span> for sign-off.
        </p>
        <Button className="w-full" disabled={blocking > 0 || !canSignOff(req, req.reviewer)} onClick={() => change(req.id, { approvedBy: req.reviewer }, before, "Approved for sending")}>
          Approve as {reviewer.name}
        </Button>
        <p className="text-center text-xs text-pretty text-muted-foreground">
          {blocking > 0 ? "Resolve the blocking notes first." : `${officer.name} drafted it, so only ${reviewer.name} can approve it.`}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-2">
      <Field>
        <FieldLabel htmlFor="foi-reviewer">Signs it off</FieldLabel>
        <Select value={req.reviewer} onValueChange={(id) => updateFoi(req.id, { reviewer: id })}>
          <SelectTrigger id="foi-reviewer" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(people)
              .filter((p) => canSignOff(req, p.id))
              .map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} · {p.role}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <FieldDescription>Not {officer.name}: whoever drafts a reply can’t approve it.</FieldDescription>
      </Field>
      <Button className="mt-1 w-full" disabled={blocking > 0} onClick={() => change(req.id, { status: "With reviewer" }, before, `Sent to ${reviewer.name} for sign-off`)}>
        Send for sign-off
      </Button>
      {blocking > 0 && <p className="text-center text-xs text-muted-foreground">Resolve the blocking notes first.</p>}
    </div>
  );
}

/** A labelled date button with a calendar; no dates before `from` or after today */
function DatePick({ id, label, value, onChange, from }: { id: string; label: string; value: Date; onChange: (d: Date) => void; from: Date }) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover>
        <PopoverTrigger asChild>
          <Button id={id} variant="outline" className="w-full justify-start font-normal">
            <CalendarIcon data-icon="inline-start" /> {formatDate(iso(value))}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={(d) => d && onChange(d)} disabled={{ before: from, after: TODAY }} />
        </PopoverContent>
      </Popover>
    </Field>
  );
}

