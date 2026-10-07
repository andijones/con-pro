"use client";

/**
 * Home: three numbers, the 90-day strip, then one tab of work at a time. Rows open in place.
 * Decision record: docs/decisions/home.md
 */
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, FileText, Inbox, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { contracts, decisions, foiRequests, people, type Decision } from "@/lib/data";
import { daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { foiDue, foiElapsed } from "@/lib/derive";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { kindMeta } from "./decision-list";
import { PersonAvatar } from "./primitives";
import { Runway } from "./runway";

type Item =
  | { type: "decision"; id: string; due: string; days: number; d: Decision; contract: (typeof contracts)[number] }
  | { type: "foi"; id: string; due: string; days: number; f: (typeof foiRequests)[number]; elapsed: number };
type DecisionItem = Extract<Item, { type: "decision" }>;

const sorted = [...decisions].sort((a, b) => a.due.localeCompare(b.due));
const decisionItems: DecisionItem[] = sorted.map((d) => ({
  type: "decision",
  id: d.id,
  due: d.due,
  days: daysUntil(d.due),
  d,
  contract: contracts.find((c) => c.id === d.contractId)!,
}));
const foiItems: Item[] = foiRequests
  .filter((f) => f.status !== "Sent" && f.status !== "Awaiting clarification")
  .map((f) => ({ type: "foi" as const, id: f.id, due: foiDue(f), days: daysUntil(foiDue(f)), f, elapsed: foiElapsed(f) }))
  .sort((a, b) => a.due.localeCompare(b.due));

const committed = decisions.filter((d) => d.kind === "notice" && daysUntil(d.due) <= 31).reduce((s, d) => s + (d.impact?.amount ?? 0), 0);
const recoverable = decisions.filter((d) => d.kind === "money").reduce((s, d) => s + (d.impact?.amount ?? 0), 0);

/** Urgency as text colour, always alongside words (WCAG 1.4.1) */
const tone = (days: number) => (days <= 7 ? "text-critical" : days <= 31 ? "text-warning" : "text-muted-foreground");

export function HomeTabs() {
  const [tab, setTab] = useState("week");
  const [done, setDone] = useState<string[]>([]);
  const live = decisionItems.filter((x) => !done.includes(x.id));
  const week = live.filter((i) => i.days <= 7);
  const [open, setOpen] = useState<string | null>(week[0]?.id ?? null);

  const tabs: { id: string; label: string; items: Item[]; empty: string }[] = [
    { id: "week", label: "This week", items: week, empty: "Nothing else needs you this week." },
    { id: "month", label: "This month", items: live.filter((i) => i.days > 7 && i.days <= 31), empty: "Nothing left for this month." },
    { id: "later", label: "Later", items: live.filter((i) => i.days > 31), empty: "Nothing further ahead." },
    { id: "foi", label: "FOI requests", items: foiItems, empty: "No FOI requests are open." },
  ];

  /** From the 90-day strip: open the decision in its tab, scroll to it and focus it */
  function select(id: string) {
    const t = tabs.find((x) => x.items.some((i) => i.id === id));
    if (!t) return;
    setTab(t.id);
    setOpen(id);
    requestAnimationFrame(() => {
      const row = document.getElementById(`row-${id}`);
      row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      row?.querySelector("button")?.focus({ preventScroll: true });
    });
  }

  function markDone(i: DecisionItem) {
    setDone((d) => [...d, i.id]);
    toast("Marked as done", {
      description: i.d.title,
      action: { label: "Undo", onClick: () => setDone((d) => d.filter((x) => x !== i.id)) },
      duration: Infinity, // WCAG 2.2.1: no time limit on Undo
    });
  }

  return (
    <>
      <dl className="mt-8 grid gap-3 sm:grid-cols-3">
        <Tile tint="bg-highlight" value={String(week.length)} label="Needs you this week" />
        <Tile tint="bg-muted" value={gbp(committed, { compact: true })} label="Commits automatically this month unless someone gives notice" />
        <Tile tint="bg-success-muted" value={gbp(recoverable, { compact: true })} label="Found that may be recoverable" valueClass="text-success" />
      </dl>

      <div className="mt-3">
        <Runway items={live.map((i) => i.d)} onSelect={select} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-10 gap-0">
        <TabsList variant="line" className="h-auto w-full justify-start gap-6 overflow-x-auto overflow-y-hidden border-b px-0 pb-0 [scrollbar-width:none]">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="h-11 flex-none px-0 text-[15px] group-data-horizontal/tabs:after:bottom-0">
              {t.label}
              <span className="tnum ml-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t.items.length}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className="pt-2">
            {t.items.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <PartyPopper className="size-6 text-primary" aria-hidden />
                <p className="mt-3 text-base font-medium">All clear</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.empty}</p>
              </div>
            ) : (
              <ul>
                {t.items.map((i) => (
                  <Row key={i.id} item={i} open={open === i.id} onToggle={() => setOpen(open === i.id ? null : i.id)} onDone={markDone} />
                ))}
              </ul>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}

function Tile({ tint, value, label, valueClass }: { tint: string; value: string; label: string; valueClass?: string }) {
  return (
    <div className={cn("flex flex-col-reverse rounded-xl px-5 py-4", tint)}>
      <dt className="mt-1 text-sm text-pretty text-foreground/75">{label}</dt>
      <dd className={cn("tnum text-[2rem] leading-none tracking-[-0.03em]", valueClass)}>{value}</dd>
    </div>
  );
}

function Row({ item: i, open, onToggle, onDone }: { item: Item; open: boolean; onToggle: () => void; onDone: (i: DecisionItem) => void }) {
  const isD = i.type === "decision";
  const Icon = isD ? kindMeta[i.d.kind].icon : Inbox;
  const title = isD ? i.d.title : i.f.subject;
  const meta = isD ? kindMeta[i.d.kind].label : `${i.f.ref} · ${i.f.status}`;
  const panel = `panel-${i.id}`;
  const [day, month] = formatDate(i.due, { year: false }).split(" ");

  return (
    <li id={`row-${i.id}`} className="scroll-mt-16 md:scroll-mt-8 border-b last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={onToggle}
          className="group grid w-full grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-4 py-4 text-left"
        >
          <span className="flex flex-col items-center rounded-lg bg-muted py-1.5 leading-none">
            <span className="tnum text-lg font-medium">{day}</span>
            <span className="mt-0.5 text-[11px] text-muted-foreground uppercase">{month}</span>
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-medium text-pretty group-hover:text-primary">{title}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-muted-foreground">
              <Icon className="size-3.5" aria-hidden />
              {meta}
              <span aria-hidden>·</span>
              <span className={cn("font-medium", tone(i.days))}>{isD ? daysLeft(i.days) : i.days <= 0 ? "Due today" : `Day ${i.elapsed} of 20`}</span>
            </span>
          </span>
          <span className="flex items-center gap-3">
            {isD && i.d.impact && <span className="tnum hidden text-[15px] font-medium sm:block">{gbp(i.d.impact.amount, { compact: true })}</span>}
            <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
          </span>
        </button>
      </h3>
      <div id={panel} role="region" aria-label={title} hidden={!open} className="pb-6 sm:pl-[4.25rem]">
        {isD ? (
          <>
            <p className="max-w-[62ch] text-[15px] leading-relaxed text-pretty text-muted-foreground">{i.d.detail}</p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {i.d.impact && (
                <span>
                  <span className="tnum font-medium text-foreground">{gbp(i.d.impact.amount)}</span> {i.d.impact.label}
                </span>
              )}
              {i.d.clauseId && (
                <Link
                  href={`/contracts/${i.contract.id}?clause=${encodeURIComponent(i.d.clauseId)}`}
                  className="inline-flex min-h-6 items-center gap-1.5 font-medium text-foreground underline decoration-input underline-offset-4 hover:decoration-primary"
                >
                  <FileText className="size-3.5" aria-hidden /> Clause {i.d.clauseId}, {i.contract.title}
                </Link>
              )}
              <span className="inline-flex items-center gap-1.5">
                <PersonAvatar id={i.d.owner} className="size-5" decorative /> {people[i.d.owner].name.replace(/^Dr /, "")}
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => toast(i.d.actions.primary, { description: "In the full product this opens the next step." })}>
                {i.d.actions.primary}
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button variant="ghost" onClick={() => onDone(i)}>
                Mark as done
              </Button>
            </div>
          </>
        ) : (
          <>
            <Progress value={Math.max((i.elapsed / 20) * 100, 3)} aria-label={`Working day ${i.elapsed} of 20`} className="h-1.5 max-w-sm" />
            <p className="mt-3 text-[15px] text-muted-foreground">
              The law gives 20 working days to reply. This one is due {formatDate(i.due)}, and {people[i.f.assignee]?.name ?? "nobody"} is handling it.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/foi/${i.f.id}`}>Open request</Link>
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
