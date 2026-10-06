"use client";
// Throwaway: /proto/contracts. Two of the three ways (Tabs went live) to see what needs action, and in what order.
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ColumnHeads, ContractRow, groups, Header, NothingMatches, PreviewSheet, tasksFrom, tone, Toolbar, useContracts, when, type Group, type Row, type Task } from "./shared";

const badgeFor = (g: Group) => (g === "needs" ? "critical" : g === "soon" ? "warning" : "outline");
const names = (items: Row[]) => (items.length <= 2 ? items.map((r) => r.title).join(" and ") : `${items[0].title}, ${items[1].title} and ${items.length - 2} more`);

/* ---------- 1. Clear sections: Needs you leads, open and fixed; the rest are an obvious disclosure list ---------- */

export function ClearSections() {
  const ctx = useContracts();
  const [openKeys, setOpenKeys] = useState<Group[]>([]);
  const lead = ctx.match.filter((r) => r.group === "needs");
  const rest = groups.filter((g) => g.key !== "needs").map((g) => ({ g, items: ctx.match.filter((r) => r.group === g.key) })).filter((x) => x.items.length);
  const allOpen = rest.every((x) => openKeys.includes(x.g.key));
  const toggle = (k: Group) => setOpenKeys((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k]));

  return (
    <>
      <Header />
      <Toolbar ctx={ctx} className="mt-6" />

      {lead.length > 0 && (
        <section aria-labelledby="needs-h" className="mt-8 overflow-hidden rounded-xl bg-card shadow-card">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-b border-l-4 border-l-critical px-5 py-4">
            <div>
              <h2 id="needs-h" className="flex items-center gap-2 text-lg font-medium">
                Needs you <Badge variant="critical" className="tnum">{lead.length}</Badge>
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">Soonest first. A decision is waiting, or the AI needs a person to check what it read.</p>
            </div>
          </div>
          <ColumnHeads className="border-b bg-muted/40" />
          <ul>
            {lead.map((r) => (
              <li key={r.id} className="border-b last:border-b-0">
                <ContractRow r={r} ctx={ctx} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {rest.length > 0 && (
        <section aria-labelledby="rest-h" className="mt-10">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 id="rest-h" className="text-base font-medium">
              Everything else
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setOpenKeys(allOpen ? [] : rest.map((x) => x.g.key))}>
              {allOpen ? "Hide all" : "Show all"}
            </Button>
          </div>
          <div className="divide-y divide-(--brand-line) overflow-hidden rounded-xl bg-card shadow-card">
            {rest.map(({ g, items }) => {
              const isOpen = openKeys.includes(g.key) || ctx.narrowing;
              const panel = `cs-${g.key}`;
              return (
                <div key={g.key}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panel}
                      onClick={() => toggle(g.key)}
                      className="group/acc flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-(--duration-fast) hover:bg-muted/60"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition-colors duration-(--duration-fast) group-hover/acc:bg-accent group-hover/acc:text-foreground">
                        <ChevronRight className={cn("size-4 transition-transform duration-(--duration-fast) ease-(--ease-out)", isOpen && "rotate-90")} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-medium">
                          {g.label}
                          <Badge variant={badgeFor(g.key)} className="tnum">
                            {items.length}
                          </Badge>
                        </span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">{isOpen ? g.hint : names(items)}</span>
                      </span>
                      <span className="hidden shrink-0 text-sm font-medium text-primary sm:block">{isOpen ? "Hide" : `Show ${items.length}`}</span>
                    </button>
                  </h3>
                  <div id={panel} hidden={!isOpen} className="border-t border-(--brand-line) bg-muted/30">
                    <ColumnHeads />
                    <ul className="pb-1">
                      {items.map((r) => (
                        <li key={r.id}>
                          <ContractRow r={r} ctx={ctx} showWhen={g.key !== "ended"} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
      {!ctx.match.length && <div className="mt-8"><NothingMatches q={ctx.q} /></div>}
      <PreviewSheet ctx={ctx} />
    </>
  );
}

/* ---------- 2. Worklist: every action in one numbered list, in the order to do them, then the register below ---------- */

const bands: { key: string; label: string; test: (t: Task) => boolean }[] = [
  { key: "week", label: "This week", test: (t) => t.days !== null && t.days <= 7 },
  { key: "month", label: "This month", test: (t) => t.days !== null && t.days > 7 && t.days <= 31 },
  { key: "later", label: "Later", test: (t) => t.days !== null && t.days > 31 },
  { key: "none", label: "No deadline yet", test: (t) => t.days === null },
];

export function Worklist() {
  const ctx = useContracts();
  const [done, setDone] = useState<string[]>([]);
  const all = tasksFrom(ctx.match);
  const open = all.filter((t) => !done.includes(t.id));
  const register = ctx.match.filter((r) => r.group !== "needs");
  let n = 0;

  function handle(t: Task) {
    setDone((d) => [...d, t.id]);
    toast("Marked as handled", { description: t.title, action: { label: "Undo", onClick: () => setDone((d) => d.filter((x) => x !== t.id)) }, duration: Infinity });
  }

  return (
    <>
      <Header>
        {open.length ? (
          <>
            <span className="text-foreground">{open.length} things need you.</span> Start at the top: they’re in the order they fall due.
          </>
        ) : (
          "Nothing needs you. Every contract is on track."
        )}
      </Header>
      <Toolbar ctx={ctx} className="mt-6" />

      <section aria-labelledby="todo-h" className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <h2 id="todo-h" className="text-lg font-medium">
            To do
          </h2>
          {all.length > 0 && (
            <div className="flex w-56 items-center gap-3 text-sm text-muted-foreground">
              <Progress value={(done.length / all.length) * 100} aria-label="Handled" className="h-1.5" />
              <span className="tnum shrink-0">
                {done.length} of {all.length} done
              </span>
            </div>
          )}
        </div>

        {open.length ? (
          <div className="flex flex-col gap-6">
            {bands.map((b) => {
              const items = open.filter(b.test);
              if (!items.length) return null;
              return (
                <div key={b.key}>
                  <h3 className="mb-2 text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">
                    {b.label} <span className="tnum">· {items.length}</span>
                  </h3>
                  <ol className="divide-y divide-(--brand-line) overflow-hidden rounded-xl bg-card shadow-card">
                    {items.map((t) => {
                      n += 1;
                      return (
                        <li key={t.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:gap-5">
                          <span aria-hidden className={cn("tnum grid size-7 shrink-0 place-items-center rounded-full text-sm font-medium", n === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            {n}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-pretty">{t.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
                              <button type="button" aria-haspopup="dialog" onClick={(e) => ctx.open(t.r, e.currentTarget)} className="underline-offset-4 hover:text-foreground hover:underline">
                                {t.r.title}
                              </button>
                              <span aria-hidden>·</span>
                              <span>{t.kind}</span>
                              {t.impact && (
                                <>
                                  <span aria-hidden>·</span>
                                  <span>
                                    <span className="tnum text-foreground">{gbp(t.impact.amount, { compact: true })}</span> {t.impact.label}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                          <span className={cn("tnum shrink-0 text-sm font-medium md:w-24 md:text-right", tone(t.days))}>{t.days === null ? "When you can" : when(t.days)}</span>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button size="sm" variant={n === 1 ? "default" : "outline"} asChild>
                              <Link href={t.to}>
                                {t.action} <ArrowRight data-icon="inline-end" />
                              </Link>
                            </Button>
                            <Button size="icon-sm" variant="ghost" aria-label={`Mark handled: ${t.title}`} title="Mark handled" onClick={() => handle(t)}>
                              <Check />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl bg-card px-5 py-8 text-center text-sm text-muted-foreground shadow-card">You’re all caught up. New deadlines will appear here as they come up.</p>
        )}
      </section>

      <section aria-labelledby="reg-h" className="mt-12">
        <h2 id="reg-h" className="mb-1 text-lg font-medium">
          All other contracts <span className="tnum font-normal text-muted-foreground">{register.length}</span>
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">Nothing to do on these yet. Soonest date first.</p>
        {register.length ? (
          <div className="overflow-hidden rounded-xl bg-card shadow-card">
            <ColumnHeads className="border-b bg-muted/40" />
            <ul className="divide-y divide-(--brand-line)">
              {register.map((r) => (
                <li key={r.id} className="relative">
                  <ContractRow r={r} ctx={ctx} showWhen={r.group !== "ended"} className="md:pr-32" />
                  <span className="pointer-events-none absolute top-1/2 right-5 hidden -translate-y-1/2 md:block">
                    <Badge variant={r.group === "soon" ? "warning" : "outline"}>{groups.find((g) => g.key === r.group)!.short}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <NothingMatches q={ctx.q} />
        )}
      </section>
      <PreviewSheet ctx={ctx} />
    </>
  );
}
