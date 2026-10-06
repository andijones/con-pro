"use client";
// Throwaway: /proto/contract-page. Two-column contract pages: Split, Tabs, Merged.
import { getContract, type Contract } from "@/lib/data";
import { daysUntil, formatDate } from "@/lib/dates";
import { nextDeadline } from "@/lib/derive";
import { cn } from "@/lib/utils";
import { ContractReader } from "@/components/contravo/contract-reader";
import { Countdown } from "@/components/contravo/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MergedReader } from "./reader-merged";
import { Activity, DecisionCompact, Facts, Flags, Header, jumpToClause, openDecisions, tone, useHandled } from "./parts";

const c = getContract("mes-imaging")!;

/** Left: sticky, and scrolls on its own if it's taller than the screen. Right: the contract. */
function Columns({ left, right, leftWidth = "24rem" }: { left: React.ReactNode; right: React.ReactNode; leftWidth?: string }) {
  return (
    <div className="mt-8 grid gap-10 xl:grid-cols-[var(--left)_minmax(0,1fr)]" style={{ "--left": leftWidth } as React.CSSProperties}>
      <div className="min-w-0 xl:sticky xl:top-(--page-bar-offset) xl:max-h-[calc(100dvh-var(--page-bar-offset)-1.5rem)] xl:self-start xl:overflow-y-auto xl:pr-1 scroll-subtle">
        {left}
      </div>
      <div className="min-w-0">{right}</div>
    </div>
  );
}

const Reader = ({ k }: { k: Contract }) => <ContractReader contractId={k.id} clauses={k.clauses} title={k.title} pages={k.pages} />;

/* ---------- 1. Split: facts, decisions and activity stacked on the left ---------- */

export function Split() {
  const { handled, mark } = useHandled();
  const open = openDecisions(c).filter((d) => !handled.includes(d.id));
  return (
    <div>
      <Header c={c} />
      <Columns
        left={
          <div className="flex flex-col gap-8">
            <section aria-labelledby="facts-h" className="rounded-xl bg-card px-4 py-1 shadow-card">
              <h2 id="facts-h" className="sr-only">
                Key facts
              </h2>
              <Facts c={c} />
            </section>
            <Flags c={c} />
            <section aria-labelledby="needs-h">
              <h2 id="needs-h" className="mb-3 text-base font-medium">
                Needs a decision <span className="tnum font-normal text-muted-foreground">{open.length}</span>
              </h2>
              {open.length ? (
                <ol className="flex flex-col gap-3">
                  {open.map((d) => (
                    <DecisionCompact key={d.id} d={d} c={c} onHandled={mark} />
                  ))}
                </ol>
              ) : (
                <p className="rounded-xl bg-muted px-4 py-5 text-sm text-muted-foreground">Nothing needs a decision on this contract.</p>
              )}
            </section>
            <section aria-labelledby="act-h">
              <h2 id="act-h" className="mb-3 text-base font-medium">
                Who has looked at this
              </h2>
              <Activity c={c} />
            </section>
          </div>
        }
        right={<Reader k={c} />}
      />
    </div>
  );
}

/* ---------- 2. Tabs: one thing at a time on the left ---------- */

export function TabsLayout() {
  const { handled, mark } = useHandled();
  const open = openDecisions(c).filter((d) => !handled.includes(d.id));
  return (
    <div>
      <Header c={c} />
      <Columns
        left={
          <Tabs defaultValue="needs" className="rounded-xl bg-card p-4 shadow-card">
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="needs">
                Needs you <span className="tnum ml-1 text-muted-foreground">{open.length}</span>
              </TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
            <TabsContent value="needs" tabIndex={-1} className="mt-4">
              {open.length ? (
                <ol className="flex flex-col gap-3 [&>li]:shadow-xs">
                  {open.map((d) => (
                    <DecisionCompact key={d.id} d={d} c={c} onHandled={mark} />
                  ))}
                </ol>
              ) : (
                <p className="py-4 text-sm text-muted-foreground">Nothing needs a decision on this contract.</p>
              )}
            </TabsContent>
            <TabsContent value="details" tabIndex={-1} className="mt-2">
              <Facts c={c} />
              <div className="mt-3">
                <Flags c={c} />
              </div>
            </TabsContent>
            <TabsContent value="activity" tabIndex={-1} className="mt-4">
              <Activity c={c} />
            </TabsContent>
          </Tabs>
        }
        right={<Reader k={c} />}
      />
    </div>
  );
}

/* ---------- 3. Merged: the deadline once, the facts, and decisions living in their clauses ---------- */

export function Merged() {
  const { handled, mark } = useHandled();
  const open = openDecisions(c).filter((d) => !handled.includes(d.id));
  const next = nextDeadline(c);
  return (
    <div>
      <Header c={c} />
      <Columns
        leftWidth="19rem"
        left={
          <div className="flex flex-col gap-6">
            <section aria-label="Next deadline" className="rounded-xl bg-card p-5 shadow-card">
              <p className="mb-2 text-xs text-muted-foreground">{next.label}</p>
              <Countdown date={next.date} />
            </section>
            <section aria-labelledby="facts-h">
              <h2 id="facts-h" className="sr-only">
                Key facts
              </h2>
              <Facts c={c} showDeadline={false} />
            </section>
            <Flags c={c} />
            <section aria-labelledby="needs-h">
              <h2 id="needs-h" className="mb-2 text-sm font-medium">
                Needs a decision <span className="tnum font-normal text-muted-foreground">{open.length}</span>
              </h2>
              <p className="mb-2 text-xs text-muted-foreground">Each one sits on the clause it comes from.</p>
              <ol className="flex flex-col">
                {open.map((d) => {
                  const days = daysUntil(d.due);
                  return (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => d.clauseId && jumpToClause(d.clauseId)}
                        className="-mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors duration-(--duration-fast) hover:bg-muted"
                      >
                        <span className="min-w-0 text-pretty">{d.title}</span>
                        <span className={cn("tnum shrink-0 text-xs font-medium", tone(days))}>{formatDate(d.due, { year: false })}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {open.length === 0 && <p className="text-sm text-muted-foreground">Nothing needs a decision.</p>}
            </section>
            <section aria-labelledby="act-h">
              <h2 id="act-h" className="mb-3 text-sm font-medium">
                Who has looked at this
              </h2>
              <Activity c={c} />
            </section>
          </div>
        }
        right={<MergedReader contractId={c.id} clauses={c.clauses} title={c.title} pages={c.pages} handled={handled} onHandled={mark} />}
      />
    </div>
  );
}
