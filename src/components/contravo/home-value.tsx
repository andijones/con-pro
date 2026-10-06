"use client";
/**
 * Home: what Contravo is worth (secured, in progress, found) and the next step on each saving.
 * Calm by design: one saving open at a time, secured savings folded, and one sticky rail card.
 * Decision record: docs/decisions/home.md
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { people } from "@/lib/data";
import { commits, coverage, found, history, nextStep, sections, steps, title, type Opp, type Stage } from "@/lib/savings";
import { TODAY, daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { MiniCalendar } from "./mini-calendar";
import { ClauseLink, PageHeader, PersonAvatar } from "./primitives";
import { Button } from "@/components/ui/button";

export const stageMeta: Record<Stage, { label: string; bar: string }> = {
  secured: { label: "Secured", bar: "bg-(--timeline-running)" },
  progress: { label: "In progress", bar: "bg-(--brand-iris)" },
  found: { label: "Found", bar: "bg-(--timeline-notice)" }, // amber: needs attention, not danger (red is for deadlines)
};

const order: Stage[] = ["secured", "progress", "found"];
const tone = (d: number) => (d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground");

function useSavings() {
  const [opps, setOpps] = useState<Opp[]>([...found, ...history]);
  const sum = (s: Stage) => opps.filter((o) => o.stage === s).reduce((t, o) => t + o.amount, 0);
  const totals = { secured: sum("secured"), progress: sum("progress"), found: sum("found") };
  const of = (s: Stage) =>
    opps
      .filter((o) => o.stage === s)
      .sort(s === "secured" ? (a, b) => (b.securedOn ?? "").localeCompare(a.securedOn ?? "") : (a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
  function move(o: Opp, to: Stage, msg: string) {
    const prev = { stage: o.stage, securedOn: o.securedOn, basis: o.basis };
    const today = TODAY.toISOString().slice(0, 10);
    setOpps((xs) => xs.map((x) => (x.id === o.id ? { ...x, stage: to, ...(to === "secured" ? { securedOn: today, basis: "confirmed by Finance" } : null) } : x)));
    toast(msg, {
      description: `${o.title} · ${gbp(o.amount)}`,
      action: { label: "Undo", onClick: () => setOpps((xs) => xs.map((x) => (x.id === o.id ? { ...x, ...prev } : x))) },
      duration: Infinity,
    });
  }
  return { totals, of, move };
}

/* ---------- main column ---------- */

function Overview({ totals }: { totals: Record<Stage, number> }) {
  return (
    <section aria-labelledby="value-h" className="rounded-xl bg-card p-6 shadow-card">
      <h2 id="value-h" className="sr-only">
        Value this year
      </h2>
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
        <div>
          <p className="tnum text-[2.75rem] leading-none tracking-[-0.03em] text-success">{gbp(totals.secured)}</p>
          <p className="mt-2 text-base">secured this financial year, confirmed by Finance</p>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-3">
          <div>
            <dt className="text-sm text-muted-foreground">Being worked on</dt>
            <dd className="tnum text-2xl">{gbp(totals.progress)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Found, waiting on you</dt>
            <dd className="tnum text-2xl">{gbp(totals.found)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {order.map((s) => (
          <span key={s} className={cn("h-full", stageMeta[s].bar)} style={{ flexGrow: totals[s] || 0.0001 }} />
        ))}
      </div>
      {/* The key is plain text: no filters competing with the work below */}
      <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {order.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", stageMeta[s].bar)} aria-hidden />
            {stageMeta[s].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 sm:ml-auto">
          <Info className="size-3.5 shrink-0" aria-hidden />
          From {coverage.checked} of {coverage.total} checked contracts. {coverage.noValue} have no value recorded yet.
        </span>
      </p>
    </section>
  );
}

/** A saving that needs a person. Only the first is open; the rest show one line until asked. */
function Saving({ o, open, onToggle, move }: { o: Opp; open: boolean; onToggle: () => void; move: ReturnType<typeof useSavings>["move"] }) {
  const d = o.due ? daysUntil(o.due) : null;
  const panelId = `next-${o.id}`;
  return (
    <li className="rounded-xl bg-card shadow-card">
      <button type="button" aria-expanded={open} aria-controls={panelId} onClick={onToggle} className="grid w-full gap-x-4 gap-y-1 rounded-xl p-4 text-left sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center">
        <span className="tnum text-lg">{gbp(o.amount)}</span>
        <span className="min-w-0">
          <span className="block font-medium text-pretty">{o.title}</span>
          <span className="block truncate text-xs text-muted-foreground">
            {title(o.contractId)} · {o.owner === "priya" ? "with you" : `with ${people[o.owner]?.name ?? "someone"}`}
          </span>
        </span>
        <span className="flex items-center gap-3">
          {d != null && <span className={cn("tnum text-xs font-medium", tone(d))}>{daysLeft(d)}</span>}
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
        </span>
      </button>
      {open && (
        <div id={panelId} className="px-4 pb-4">
          <div className={cn("rounded-lg p-4", o.stage === "found" ? "bg-warning-muted/70" : "bg-highlight/60")}>
            <p className="text-xs font-medium text-muted-foreground">{o.stage === "found" ? "Your next step" : "What happens next"}</p>
            <p className="mt-1 text-sm text-pretty">{nextStep(o)}</p>
            {o.clauseId && (
              <div className="mt-3">
                <ClauseLink contractId={o.contractId} clause={o.clauseId} contractTitle={title(o.contractId)} />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {o.stage === "found" ? (
                <>
                  <Button size="sm" asChild>
                    <Link href={`/contracts/${o.contractId}`}>
                      {o.action} <ArrowRight data-icon="inline-end" />
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => move(o, "progress", "Moved to in progress")}>
                    <Check data-icon="inline-start" /> {steps[o.id]?.done ?? "I’ve done this"}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => move(o, "secured", "Saving secured")}>
                  <Check data-icon="inline-start" /> Finance has confirmed it
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function Secured({ items, total }: { items: Opp[]; total: number }) {
  const [open, setOpen] = useState(false);
  return (
    <section aria-labelledby="sec-secured">
      <h2 id="sec-secured" className="sr-only">
        Secured this year
      </h2>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="secured-list"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-xl bg-success-muted/60 px-4 py-3 text-left transition-colors duration-(--duration-fast) hover:bg-success-muted"
      >
        <span className="grid size-6 place-items-center rounded-full bg-success-muted text-success" aria-hidden>
          <Check className="size-3.5" />
        </span>
        <span className="flex-1 text-sm">
          <span className="font-medium">
            {items.length} {items.length === 1 ? "saving" : "savings"} secured this year
          </span>{" "}
          <span className="tnum text-muted-foreground">· {gbp(total)} confirmed by Finance</span>
        </span>
        <span className="text-sm text-muted-foreground">{open ? "Hide" : "Show"}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
      </button>
      {open && (
        <ol id="secured-list" className="mt-2 flex flex-col divide-y rounded-xl bg-card shadow-card">
          {items.map((o) => (
            <li key={o.id} className="grid gap-x-4 px-4 py-3 text-sm sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-center">
              <span className="tnum text-success">{gbp(o.amount)}</span>
              <span className="min-w-0">
                <span className="block font-medium">{o.title}</span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <PersonAvatar id={o.owner} className="size-4" decorative />
                  {o.owner === "priya" ? "You" : people[o.owner]?.name}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">{o.securedOn && formatDate(o.securedOn)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function Main({ s }: { s: ReturnType<typeof useSavings> }) {
  const work = [...s.of("found"), ...s.of("progress")];
  const [openId, setOpenId] = useState<string | null>(work[0]?.id ?? null);
  return (
    <div className="flex min-w-0 flex-col gap-12">
      {sections
        .filter((sec) => sec.stage !== "secured")
        .map((sec) => {
          const items = s.of(sec.stage);
          return (
            <section key={sec.stage} aria-labelledby={`sec-${sec.stage}`}>
              <h2 id={`sec-${sec.stage}`} className="section-title flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", stageMeta[sec.stage].bar)} aria-hidden />
                {sec.title}
                <span className="tnum text-sm font-normal text-muted-foreground">{items.length}</span>
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted-foreground">{sec.help}</p>
              {items.length === 0 ? (
                <p className="rounded-xl bg-muted px-4 py-5 text-sm text-muted-foreground">
                  {sec.stage === "progress" ? "Nothing in progress. Start on a saving above and it moves here." : "Nothing new. Contravo checks every contract overnight."}
                </p>
              ) : (
                <ol className="flex flex-col gap-3">
                  {items.map((o) => (
                    <Saving key={o.id} o={o} open={openId === o.id} onToggle={() => setOpenId((x) => (x === o.id ? null : o.id))} move={s.move} />
                  ))}
                </ol>
              )}
            </section>
          );
        })}
      <Secured items={s.of("secured")} total={s.totals.secured} />
    </div>
  );
}

/* ---------- rails ---------- */

function CommitRows() {
  return (
    <ol className="flex flex-col divide-y">
      {commits.map(({ d, days }) => (
        <li key={d.id}>
          <Link href={`/contracts/${d.contractId}`} className="-mx-2 flex items-baseline justify-between gap-3 rounded-md px-2 py-2.5 transition-colors duration-(--duration-fast) hover:bg-muted/60">
            <span className="min-w-0">
              <span className="block text-sm text-pretty">{title(d.contractId)}</span>
              <span className={cn("tnum text-xs font-medium", tone(days))}>notice by {formatDate(d.due, { year: false })}</span>
            </span>
            <span className="tnum shrink-0 text-sm">{gbp(d.impact?.amount ?? 0, { compact: true })}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** The rail: one sticky card. The calendar, then the spend that commits unless someone gives notice. */
function Rail() {
  return (
    <aside className="min-w-0 xl:sticky xl:top-(--page-bar-offset) xl:self-start">
      <div className="rounded-xl bg-card shadow-card md:max-w-md xl:max-w-none">
        {/* The calendar's own card is flattened into this one */}
        <div className="[&>section]:rounded-none [&>section]:bg-transparent [&>section]:shadow-none">
          <MiniCalendar />
        </div>
        <section aria-labelledby="commits-h" className="border-t border-(--brand-line) px-4 pt-4 pb-3">
          <h2 id="commits-h" className="text-sm font-medium">
            Decide before it commits
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Renews unless someone gives notice</p>
          <div className="mt-1">
            <CommitRows />
          </div>
        </section>
      </div>
    </aside>
  );
}

/* ---------- pages ---------- */

export function HomeValue() {
  const s = useSavings();
  return (
    <div>
      <PageHeader
        title="Good morning, Priya"
        actions={
          <Button variant="outline" onClick={() => toast.success("Savings report exported", { description: "CSV with the clause behind every figure" })}>
            <Download data-icon="inline-start" /> Export savings report
          </Button>
        }
      >
        What Contravo has found and secured this year, and what you can act on today.
      </PageHeader>
      <div className="mt-6">
        <Overview totals={s.totals} />
      </div>
      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-12">
        <Main s={s} />
        <Rail />
      </div>
    </div>
  );
}
