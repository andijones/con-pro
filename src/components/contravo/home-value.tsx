"use client";
/**
 * Home: what Contravo is worth (secured, in progress, found) and the next step on every saving.
 * Decision record: docs/decisions/home.md
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Download, Info, Sparkles, SquarePen } from "lucide-react";
import { toast } from "sonner";
import { people } from "@/lib/data";
import { commits, coverage, found, history, nextStep, sections, steps, title, type Opp, type Stage } from "@/lib/savings";
import { TODAY, daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ClauseLink, PageHeader, PersonAvatar } from "./primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export const stageMeta: Record<Stage, { label: string; bar: string; badge: "outline" | "secondary" | "success" }> = {
  secured: { label: "Secured", bar: "bg-(--timeline-running)", badge: "success" },
  progress: { label: "In progress", bar: "bg-(--brand-iris)", badge: "secondary" },
  found: { label: "Found", bar: "bg-(--timeline-notice)", badge: "outline" }, // amber: needs attention, not danger (red is for deadlines)
};


export function HomeValue() {
  const [opps, setOpps] = useState<Opp[]>([...found, ...history]);
  const [filter, setFilter] = useState<Stage | "all">("all");

  const sum = (s: Stage) => opps.filter((o) => o.stage === s).reduce((t, o) => t + o.amount, 0);
  const totals = { secured: sum("secured"), progress: sum("progress"), found: sum("found") };
  const all = totals.secured + totals.progress + totals.found;
  const order: Stage[] = ["secured", "progress", "found"];
  const rank = { found: 0, progress: 1, secured: 2 };
  const list = opps
    .filter((o) => filter === "all" || o.stage === filter)
    // Work to do: soonest deadline first. Secured: most recent first.
    .sort((a, b) =>
      rank[a.stage] - rank[b.stage] ||
      (a.stage === "secured" ? (b.securedOn ?? "").localeCompare(a.securedOn ?? "") : (a.due ?? "9999").localeCompare(b.due ?? "9999")),
    );

  function move(o: Opp, to: Stage, msg: string) {
    const from = o.stage;
    const was = { securedOn: o.securedOn, basis: o.basis };
    const today = TODAY.toISOString().slice(0, 10);
    setOpps((xs) =>
      xs.map((x) => (x.id === o.id ? { ...x, stage: to, ...(to === "secured" ? { securedOn: today, basis: "confirmed by Finance" } : null) } : x)),
    );
    toast(msg, {
      description: `${o.title} · ${gbp(o.amount)}`,
      action: { label: "Undo", onClick: () => setOpps((xs) => xs.map((x) => (x.id === o.id ? { ...x, stage: from, ...was } : x))) },
      duration: Infinity,
    });
  }

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

      {/* Value overview */}
      <section aria-labelledby="value-h" className="mt-6 rounded-xl bg-card p-6 shadow-card">
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
              <dt className="text-sm text-muted-foreground">Found, waiting on a decision</dt>
              <dd className="tnum text-2xl">{gbp(totals.found)}</dd>
            </div>
          </dl>
        </div>

        {/* Pipeline bar: each segment filters the list */}
        <div className="mt-6 flex h-3 gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {order.map((s) => (
            <span key={s} className={cn("h-full transition-[flex-grow] duration-(--duration-base) ease-(--ease-out)", stageMeta[s].bar)} style={{ flexGrow: totals[s] || 0.0001 }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <ToggleGroup type="single" variant="outline" size="sm" className="flex-wrap" value={filter} onValueChange={(v) => setFilter((v as Stage | "all") || "all")} aria-label="Show savings">
            <ToggleGroupItem value="all">All · {gbp(all, { compact: true })}</ToggleGroupItem>
            {order.map((s) => (
              <ToggleGroupItem key={s} value={s}>
                <span className={cn("size-2 rounded-full", stageMeta[s].bar)} aria-hidden />
                {stageMeta[s].label} · {gbp(totals[s], { compact: true })}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5 shrink-0" aria-hidden />
            Counted from {coverage.checked} of {coverage.total} checked contracts. {coverage.noValue} have no value recorded, so savings there aren’t counted yet.
          </p>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Savings, grouped by what you do next */}
        <div className="flex flex-col gap-10">
          {sections
            .filter((sec) => filter === "all" || filter === sec.stage)
            .map((sec) => {
              const items = list.filter((o) => o.stage === sec.stage);
              return (
                <section key={sec.stage} aria-labelledby={`sec-${sec.stage}`}>
                  <h2 id={`sec-${sec.stage}`} className="flex items-center gap-2 text-base font-medium">
                    <span className={cn("size-2.5 rounded-full", stageMeta[sec.stage].bar)} aria-hidden />
                    {sec.title}
                    <Badge variant="outline" className="tnum">
                      {items.length}
                    </Badge>
                  </h2>
                  <p className="mt-1 mb-3 text-sm text-muted-foreground">{sec.help}</p>
                  {items.length === 0 ? (
                    <p className="rounded-xl bg-muted px-4 py-5 text-sm text-muted-foreground">
                      {sec.stage === "progress" ? "Nothing in progress. Start on a saving above and it moves here." : sec.stage === "found" ? "Nothing new. Contravo checks every contract overnight." : "Nothing secured yet this year."}
                    </p>
                  ) : (
                    <ol className="flex flex-col gap-2">
                      {items.map((o) => (
                        <SavingCard key={o.id} o={o} onMove={move} />
                      ))}
                    </ol>
                  )}
                </section>
              );
            })}
        </div>

        <aside className="flex flex-col gap-8">
          {/* Spend you control */}
          <section aria-labelledby="commits-h">
            <h2 id="commits-h" className="text-base font-medium">
              Decide before it commits
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Not savings: spend that renews automatically unless someone gives notice.</p>
            <ol className="mt-3 flex flex-col divide-y rounded-xl bg-card shadow-card">
              {commits.map(({ d, days }) => (
                <li key={d.id}>
                  <Link href={`/contracts/${d.contractId}`} className="block px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-muted/60">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="tnum text-lg">{gbp(d.impact?.amount ?? 0, { compact: true })}</span>
                      <span className={cn("tnum text-xs font-medium", days <= 7 ? "text-critical" : days <= 31 ? "text-warning" : "text-muted-foreground")}>
                        notice by {formatDate(d.due, { year: false })}
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm text-pretty">{title(d.contractId)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>

          {/* Start a chat */}
          <section aria-labelledby="chat-h" className="rounded-xl bg-card p-5 shadow-card">
            <span className="grid size-9 place-items-center rounded-lg bg-highlight text-primary" aria-hidden>
              <Sparkles className="size-4" />
            </span>
            <h2 id="chat-h" className="mt-3 text-base font-medium">
              Looking for more savings?
            </h2>
            <p className="mt-1 text-sm text-pretty text-muted-foreground">
              Ask Contravo where you’re paying above framework rates, or check a quote before you sign. Every answer shows the clause it came from.
            </p>
            <div className="ai-glow mt-4 rounded-lg">
              <Button variant="outline" className="w-full bg-background hover:bg-[color-mix(in_oklab,var(--muted)_60%,var(--background))]" asChild>
                <Link href="/chat">
                  <SquarePen className="text-muted-foreground" /> Start a new chat
                </Link>
              </Button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}


function Tracker({ stage }: { stage: Stage }) {
  const order: Stage[] = ["found", "progress", "secured"];
  const at = order.indexOf(stage);
  return (
    <ol className="flex items-center gap-1.5 text-xs" aria-label="Progress">
      {order.map((s, i) => (
        <li key={s} aria-current={i === at ? "step" : undefined} className="flex items-center gap-1.5">
          <span
            className={cn(
              "grid size-5 place-items-center rounded-full text-[11px] font-medium",
              i < at
                ? "bg-success-muted text-success"
                : i === at
                  ? s === "found"
                    ? "bg-warning-muted text-warning"
                    : "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < at ? <Check className="size-3" aria-hidden /> : i + 1}
          </span>
          <span className={cn(i === at ? "font-medium text-foreground" : "text-muted-foreground")}>
            {stageMeta[s].label}
            {i < at && <span className="sr-only"> (done)</span>}
          </span>
          {i < order.length - 1 && <span className="mx-0.5 h-px w-4 bg-border" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}

function SavingCard({ o, onMove }: { o: Opp; onMove: (o: Opp, to: Stage, msg: string) => void }) {
  const d = o.due ? daysUntil(o.due) : null;
  return (
    <li className="rounded-xl bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tracker stage={o.stage} />
        {o.stage !== "secured" && d != null && (
          <span className={cn("tnum text-xs font-medium", d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground")}>{daysLeft(d)}</span>
        )}
        {o.stage === "secured" && o.securedOn && <span className="text-xs text-muted-foreground">Confirmed {formatDate(o.securedOn)}</span>}
      </div>

      <div className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
        <div>
          <p className={cn("tnum text-xl", o.stage === "secured" && "text-success")}>{gbp(o.amount)}</p>
          <p className="text-xs text-muted-foreground">{o.basis}</p>
        </div>
        <div className="min-w-0">
          <p className="font-medium text-pretty">{o.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {o.clauseId ? (
              <ClauseLink contractId={o.contractId} clause={o.clauseId} contractTitle={title(o.contractId)} />
            ) : (
              <Link href={`/contracts/${o.contractId}`} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                {title(o.contractId)}
              </Link>
            )}
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PersonAvatar id={o.owner} className="size-5" decorative />
              {o.stage === "secured" ? "Secured by" : "With"} {o.owner === "priya" ? "you" : (people[o.owner]?.name ?? "someone")}
            </span>
          </div>
        </div>
      </div>

      {o.stage !== "secured" && (
        <div className={cn("mt-4 rounded-lg p-3", o.stage === "found" ? "bg-warning-muted/70" : "bg-highlight/60")}>
          <p className="text-xs font-medium text-muted-foreground">{o.stage === "found" ? "Your next step" : "What happens next"}</p>
          <p className="mt-0.5 text-sm text-pretty">{nextStep(o)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {o.stage === "found" ? (
              <>
                <Button size="sm" asChild>
                  <Link href={`/contracts/${o.contractId}`}>
                    {o.action} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => onMove(o, "progress", "Moved to in progress")}>
                  <Check data-icon="inline-start" /> {steps[o.id]?.done ?? "I’ve done this"}
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => onMove(o, "secured", "Saving secured")}>
                <Check data-icon="inline-start" /> Finance has confirmed it
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
