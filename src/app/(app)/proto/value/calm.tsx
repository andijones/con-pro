"use client";
// Throwaway: /proto/value. Three calmer takes on the Value home: Focus, Summary, Checklist.
import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { TODAY, daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ClauseLink, PageHeader } from "@/components/contravo/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { commits, found, history, nextStep, stageMeta, steps, title, type Opp, type Stage } from "../home/value";

/* ---------- shared state ---------- */

function useSavings() {
  const [opps, setOpps] = useState<Opp[]>([...found, ...history]);
  const today = TODAY.toISOString().slice(0, 10);
  const byDue = (a: Opp, b: Opp) => (a.due ?? "9999").localeCompare(b.due ?? "9999");
  const of = (s: Stage) => opps.filter((o) => o.stage === s).sort(s === "secured" ? (a, b) => (b.securedOn ?? "").localeCompare(a.securedOn ?? "") : byDue);
  const total = (s: Stage) => of(s).reduce((t, o) => t + o.amount, 0);
  function move(o: Opp, to: Stage, msg: string) {
    const prev = { stage: o.stage, securedOn: o.securedOn, basis: o.basis };
    setOpps((xs) => xs.map((x) => (x.id === o.id ? { ...x, stage: to, ...(to === "secured" ? { securedOn: today, basis: "confirmed by Finance" } : null) } : x)));
    toast(msg, {
      description: `${o.title} · ${gbp(o.amount)}`,
      action: { label: "Undo", onClick: () => setOpps((xs) => xs.map((x) => (x.id === o.id ? { ...x, ...prev } : x))) },
      duration: Infinity,
    });
  }
  return { of, total, move };
}

const tone = (d: number | null) => (d == null ? "text-muted-foreground" : d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground");
const doneLabel = (o: Opp) => steps[o.id]?.done ?? "I’ve done this";

function StepActions({ o, move, size = "default" }: { o: Opp; move: ReturnType<typeof useSavings>["move"]; size?: "default" | "sm" }) {
  return o.stage === "found" ? (
    <div className="flex flex-wrap gap-2">
      <Button size={size} asChild>
        <Link href={`/contracts/${o.contractId}`}>
          {o.action} <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
      <Button size={size} variant="outline" onClick={() => move(o, "progress", "Moved to in progress")}>
        <Check data-icon="inline-start" /> {doneLabel(o)}
      </Button>
    </div>
  ) : (
    <Button size={size} variant="outline" onClick={() => move(o, "secured", "Saving secured")}>
      <Check data-icon="inline-start" /> Finance has confirmed it
    </Button>
  );
}

/* ---------- 1. Focus: one thing at a time ---------- */

export function Focus() {
  const { of, total, move } = useSavings();
  const [showRest, setShowRest] = useState(false);
  const todo = of("found");
  const waiting = of("progress");
  const next = todo[0] ?? waiting[0];
  const rest = [...todo, ...waiting].filter((o) => o !== next);
  const d = next?.due ? daysUntil(next.due) : null;

  return (
    <div>
      <PageHeader title="Good morning, Priya">
        Contravo has secured <span className="tnum font-medium text-success">{gbp(total("secured"))}</span> this year, and found{" "}
        <span className="tnum font-medium text-foreground">{gbp(total("found") + total("progress"))}</span> more.
      </PageHeader>

      <div className="mx-auto mt-10 max-w-2xl">
        {next ? (
          <section aria-labelledby="next-h" className="rounded-2xl bg-card p-8 shadow-raised">
            <p className="text-sm font-medium text-muted-foreground">Your next step</p>
            <h2 id="next-h" className="mt-2 text-2xl leading-tight font-medium text-balance">
              {next.title}
            </h2>
            <p className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="tnum text-lg">{gbp(next.amount)}</span>
              <span className="text-sm text-muted-foreground">{next.basis}</span>
              {d != null && <span className={cn("tnum text-sm font-medium", tone(d))}>{daysLeft(d)}</span>}
            </p>
            <p className="mt-5 text-base text-pretty">{nextStep(next)}</p>
            {next.clauseId && (
              <div className="mt-4">
                <ClauseLink contractId={next.contractId} clause={next.clauseId} contractTitle={title(next.contractId)} />
              </div>
            )}
            <div className="mt-6">
              <StepActions o={next} move={move} />
            </div>
          </section>
        ) : (
          <section className="rounded-2xl bg-muted p-8 text-center">
            <p className="text-lg font-medium">You’re all caught up</p>
            <p className="mt-1 text-sm text-muted-foreground">Contravo checks every contract overnight and will bring you the next saving it finds.</p>
          </section>
        )}

        {rest.length > 0 && (
          <div className="mt-6">
            <Button variant="ghost" onClick={() => setShowRest((v) => !v)} aria-expanded={showRest} aria-controls="focus-rest" className="text-muted-foreground">
              {showRest ? "Hide" : "Then"} {rest.length} more {rest.length === 1 ? "saving" : "savings"}
              <ChevronDown className={cn("transition-transform duration-(--duration-fast)", showRest && "rotate-180")} aria-hidden />
            </Button>
            {showRest && (
              <ol id="focus-rest" className="mt-2 flex flex-col divide-y rounded-xl bg-card shadow-card">
                {rest.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <span className="min-w-0">
                      <span className="block font-medium">{o.title}</span>
                      <span className="tnum text-sm text-muted-foreground">
                        {gbp(o.amount)} · {o.stage === "progress" ? "with Finance" : o.due ? daysLeft(daysUntil(o.due)).toLowerCase() : ""}
                      </span>
                    </span>
                    <StepActions o={o} move={move} size="sm" />
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-muted-foreground">
          Also: {commits.length} contracts renew automatically this month unless you give notice.{" "}
          <Link href="/timeline" className="font-medium text-primary underline-offset-4 hover:underline">
            See them on the timeline
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ---------- 2. Summary: overview first, detail on request ---------- */

export function Summary() {
  const { of, total, move } = useSavings();
  const [openStage, setOpenStage] = useState<Stage | null>("found");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const uid = useId();
  const tiles: { s: Stage; line: string; empty: string }[] = [
    { s: "found", line: "need you to take the first step", empty: "Nothing new to act on" },
    { s: "progress", line: "waiting for Finance to confirm", empty: "Nothing waiting" },
    { s: "secured", line: "secured this year", empty: "Nothing secured yet" },
  ];

  return (
    <div>
      <PageHeader title="Good morning, Priya">Here’s what Contravo has found, and the one place you’re needed.</PageHeader>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {tiles.map(({ s, line, empty }) => {
          const n = of(s).length;
          const on = openStage === s;
          return (
            <button
              key={s}
              type="button"
              aria-expanded={on}
              aria-controls={`${uid}-${s}`}
              onClick={() => {
                setOpenStage(on ? null : s);
                setOpenRow(null);
              }}
              className={cn(
                "rounded-xl p-5 text-left shadow-card transition-[background-color,box-shadow] duration-(--duration-fast) hover:shadow-raised",
                on ? "bg-highlight/60 shadow-raised" : "bg-card",
              )}
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn("size-2.5 rounded-full", stageMeta[s].bar)} aria-hidden />
                {stageMeta[s].label}
              </span>
              <span className={cn("tnum mt-2 block text-3xl", s === "secured" && "text-success")}>{gbp(total(s), { compact: true })}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{n ? `${n} ${n === 1 ? "saving" : "savings"} ${line}` : empty}</span>
            </button>
          );
        })}
      </div>

      {openStage && (
        <section id={`${uid}-${openStage}`} aria-label={stageMeta[openStage].label} className="mt-6">
          {of(openStage).length === 0 ? (
            <p className="rounded-xl bg-muted px-5 py-6 text-sm text-muted-foreground">Nothing here right now.</p>
          ) : (
            <ol className="flex flex-col divide-y rounded-xl bg-card shadow-card">
              {of(openStage).map((o) => {
                const open = openRow === o.id;
                const d = o.due ? daysUntil(o.due) : null;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenRow(open ? null : o.id)}
                      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-(--duration-fast) hover:bg-muted/50"
                    >
                      <span className={cn("tnum w-24 shrink-0 text-lg", o.stage === "secured" && "text-success")}>{gbp(o.amount, { compact: true })}</span>
                      <span className="min-w-0 flex-1 font-medium">{o.title}</span>
                      <span className={cn("tnum hidden shrink-0 text-sm sm:block", o.stage === "secured" ? "text-muted-foreground" : tone(d))}>
                        {o.stage === "secured" && o.securedOn ? formatDate(o.securedOn) : d != null ? daysLeft(d) : ""}
                      </span>
                      <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
                    </button>
                    {open && (
                      <div className="px-5 pb-5 sm:pl-[8.5rem]">
                        {o.stage !== "secured" ? (
                          <>
                            <p className="text-sm text-pretty">{nextStep(o)}</p>
                            {o.clauseId && (
                              <div className="mt-3">
                                <ClauseLink contractId={o.contractId} clause={o.clauseId} contractTitle={title(o.contractId)} />
                              </div>
                            )}
                            <div className="mt-4">
                              <StepActions o={o} move={move} size="sm" />
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {o.basis}. {title(o.contractId)}.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------- 3. Checklist: plain to-dos ---------- */

export function Checklist() {
  const { of, total, move } = useSavings();
  const todo = [...of("found"), ...of("progress")];
  const done = of("secured");
  // A to-do is the action itself, in the imperative
  const todoText: Record<string, { found: string; progress: string }> = {
    "d-path-uplift": { found: "Send Corvel an objection to the 9.4% price rise", progress: "Confirm with Finance that Corvel is charging the CPI rate" },
    "d-mes-vat": { found: "Send the imaging VAT evidence to Finance", progress: "Confirm with Finance that the VAT has been reclaimed" },
    "d-linen-dup": { found: "Ask Finance to check the two theatre linen invoices", progress: "Confirm with Finance that the duplicate linen service is cancelled" },
  };
  const sentence = (o: Opp) => todoText[o.id]?.[o.stage === "found" ? "found" : "progress"] ?? o.title;

  return (
    <div>
      <PageHeader title="Good morning, Priya">
        {todo.length ? `${todo.length} things to do. Together they’re worth ${gbp(total("found") + total("progress"))}.` : "Nothing to do. Every saving is secured."}
      </PageHeader>

      <div className="mt-6 max-w-2xl">
        <ul className="flex flex-col divide-y rounded-xl bg-card shadow-card" aria-label="To do">
          {todo.map((o) => {
            const d = o.due ? daysUntil(o.due) : null;
            const id = `todo-${o.id}`;
            return (
              <li key={o.id} className="flex gap-3 px-5 py-4">
                <Checkbox
                  id={id}
                  className="mt-1"
                  checked={false}
                  onCheckedChange={() => move(o, o.stage === "found" ? "progress" : "secured", o.stage === "found" ? "Done. Now waiting on Finance" : "Saving secured")}
                />
                <div className="min-w-0 flex-1">
                  <label htmlFor={id} className="block cursor-pointer font-medium text-pretty">
                    {sentence(o)}
                  </label>
                  <p className="tnum mt-0.5 text-sm text-muted-foreground">
                    Saves {gbp(o.amount)}
                    {o.stage === "found" && d != null && (
                      <>
                        {" · "}
                        <span className={tone(d)}>{o.due && d <= 31 ? `by ${formatDate(o.due, { year: false })}` : daysLeft(d).toLowerCase()}</span>
                      </>
                    )}
                    {o.stage === "progress" && " · you’ve done your part"}
                  </p>
                  {o.stage === "found" && (
                    <Link href={`/contracts/${o.contractId}`} className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                      {o.action} <ArrowRight className="size-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
          {todo.length === 0 && <li className="px-5 py-6 text-sm text-muted-foreground">All done. Contravo will add the next one it finds.</li>}
        </ul>

        <h2 className="mt-10 mb-3 text-sm font-medium">
          Done this year <span className="tnum font-normal text-success">· {gbp(total("secured"))} secured</span>
        </h2>
        <ul className="flex flex-col gap-2" aria-label="Done">
          {done.map((o) => (
            <li key={o.id} className="flex items-start gap-3 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span className="min-w-0 flex-1 text-muted-foreground">
                <span className="text-foreground">{o.title}</span> · <span className="tnum">{gbp(o.amount)}</span>
              </span>
              {o.securedOn === TODAY.toISOString().slice(0, 10) && (
                <Button variant="ghost" size="icon-sm" aria-label={`Undo: ${o.title}`} onClick={() => move(o, "progress", "Moved back to to-do")}>
                  <Undo2 />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
