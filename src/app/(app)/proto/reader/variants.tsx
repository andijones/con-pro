"use client";
// Throwaway: /proto/reader. Three ways to read a contract: Risk map, Brief, Annotated.
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, FileText, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { all, contract, counts, flagged, parts, riskBadge, riskEdge, riskLabel, riskOrder, riskTint, type DocClause, type Risk, type Topic } from "./doc";

function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <Badge variant={riskBadge[risk]} className="shrink-0">
      {riskLabel[risk]}
    </Badge>
  );
}

function ActionLink({ c }: { c: DocClause }) {
  if (!c.action) return null;
  return (
    <Button size="sm" variant="outline" asChild>
      <Link href={c.action.href}>
        {c.action.label} <ArrowRight data-icon="inline-end" />
      </Link>
    </Button>
  );
}

const scrollToClause = (id: string) => {
  const el = document.getElementById(`clause-${id}`);
  el?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el?.focus({ preventScroll: true });
};

/* ---------- 1. Risk map: the document, tinted by risk, with a map of where risk sits ---------- */

export function RiskMap() {
  const [show, setShow] = useState<"all" | Risk>("all");
  const visible = (c: DocClause) => show === "all" || c.risk === show;

  return (
    <div>
      <section aria-label="Summary" className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-card">
        <div>
          <p className="text-base font-medium">
            Contravo read all {all.length} clauses. {flagged.length} need your attention.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Everything else was read and nothing was flagged.</p>
        </div>
        <ToggleGroup type="single" variant="outline" size="sm" value={show} onValueChange={(v) => setShow((v as "all" | Risk) || "all")} aria-label="Show clauses" className="flex-wrap">
          <ToggleGroupItem value="all">Whole contract · {all.length}</ToggleGroupItem>
          {(["high", "medium", "low"] as Risk[]).map((r) => (
            <ToggleGroupItem key={r} value={r}>
              {riskLabel[r]} · {counts[r]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_2.5rem]">
        <article className="rounded-xl bg-card px-6 py-8 shadow-card sm:px-10" aria-label={`${contract.title}: contract text`}>
          <p className="mb-8 text-center text-xs tracking-[0.12em] text-muted-foreground uppercase">Agreement</p>
          {parts.map((p) => {
            const cs = p.clauses.filter(visible);
            if (!cs.length) return null;
            return (
              <section key={p.number} className="mb-8">
                <h3 className="mb-3 text-sm font-medium">
                  {p.number}. {p.title}
                </h3>
                <div className="flex flex-col gap-3">
                  {cs.map((c) =>
                    c.plain && c.risk ? (
                      <div key={c.id} id={`clause-${c.id}`} tabIndex={-1} className={cn("scroll-mt-28 rounded-lg border-l-4 p-4", riskEdge[c.risk], riskTint[c.risk])}>
                        <div className="flex flex-wrap items-center gap-2">
                          <RiskBadge risk={c.risk} />
                          <span className="text-sm font-medium">{c.heading}</span>
                          <span className="text-xs text-muted-foreground">Clause {c.number}</span>
                        </div>
                        <p className="mt-2 text-base font-medium text-pretty">{c.plain}</p>
                        <p className="mt-3 font-document text-[14px] leading-[1.7] text-foreground/80">{c.text}</p>
                        {c.action && (
                          <div className="mt-3">
                            <ActionLink c={c} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <p key={c.id} id={`clause-${c.id}`} className="px-4 font-document text-[14px] leading-[1.7] text-foreground/80">
                        <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                        <span className="font-sans text-[13px] font-medium text-foreground">{c.heading}.</span> {c.text}
                      </p>
                    ),
                  )}
                </div>
              </section>
            );
          })}
        </article>

        {/* The map: one notch per clause, coloured where Contravo flagged something */}
        <nav aria-label="Where the risks are" className="hidden md:block">
          <ol className="sticky top-(--page-bar-offset) flex flex-col gap-0.5 rounded-full bg-muted p-1.5">
            {all.map((c) =>
              c.risk && c.plain ? (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => scrollToClause(c.id)}
                    aria-label={`${riskLabel[c.risk]}: ${c.heading}, clause ${c.number}`}
                    title={`${riskLabel[c.risk]} · ${c.heading}`}
                    className={cn(
                      "block h-6 w-full rounded-full transition-transform duration-(--duration-fast) hover:scale-x-125",
                      c.risk === "high" ? "bg-critical" : c.risk === "medium" ? "bg-(--timeline-notice)" : "bg-success",
                    )}
                  />
                </li>
              ) : (
                <li key={c.id} aria-hidden className="h-1.5 rounded-full bg-border" />
              ),
            )}
          </ol>
        </nav>
      </div>
    </div>
  );
}

/* ---------- 2. Brief: plain English first, by topic; the wording on request ---------- */

const topicOrder: Topic[] = ["Ending and renewal", "Money", "Tax", "Service", "Liability", "General"];

export function Brief() {
  const [openWording, setOpenWording] = useState<string[]>([]);
  const [openRest, setOpenRest] = useState<Topic[]>([]);
  const topics = topicOrder
    .map((t) => {
      const cs = all.filter((c) => c.topic === t);
      const notes = cs.filter((c) => c.plain && c.risk).sort((a, b) => riskOrder[a.risk!] - riskOrder[b.risk!]);
      return { t, notes, rest: cs.filter((c) => !c.plain) };
    })
    .filter((x) => x.notes.length || x.rest.length)
    .sort((a, b) => (a.notes[0] ? riskOrder[a.notes[0].risk!] : 9) - (b.notes[0] ? riskOrder[b.notes[0].risk!] : 9));

  return (
    <div className="max-w-3xl">
      <section aria-label="Summary" className="rounded-xl bg-card p-5 shadow-card">
        <p className="text-base font-medium">{flagged.length} things to know about this contract</p>
        <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {(["high", "medium", "low"] as Risk[]).map((r) => (
            <Badge key={r} variant={riskBadge[r]}>
              {counts[r]} {riskLabel[r].toLowerCase()}
            </Badge>
          ))}
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" aria-hidden /> {all.length - flagged.length} more clauses read, nothing flagged
          </span>
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-10">
        {topics.map(({ t, notes, rest }) => (
          <section key={t} aria-labelledby={`topic-${t}`}>
            <h2 id={`topic-${t}`} className="mb-3 text-base font-medium">
              {t}
            </h2>
            <ol className="flex flex-col gap-3">
              {notes.map((c) => {
                const open = openWording.includes(c.id);
                return (
                  <li key={c.id} className="rounded-xl bg-card p-5 shadow-card">
                    <div className="flex flex-wrap items-center gap-2">
                      <RiskBadge risk={c.risk!} />
                      <span className="text-xs text-muted-foreground">
                        {c.heading} · Clause {c.number}
                      </span>
                    </div>
                    <p className="mt-2 text-[17px] leading-snug text-pretty">{c.plain}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <ActionLink c={c} />
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-expanded={open}
                        onClick={() => setOpenWording((x) => (open ? x.filter((y) => y !== c.id) : [...x, c.id]))}
                        className="text-muted-foreground"
                      >
                        <FileText data-icon="inline-start" /> {open ? "Hide" : "Show"} the contract wording
                      </Button>
                    </div>
                    {open && (
                      <blockquote className="mt-3 border-l-2 border-(--brand-line) pl-4 font-document text-[14px] leading-[1.7] text-foreground/80">
                        <span className="font-sans text-xs font-medium text-muted-foreground">{c.number} </span>
                        {c.text}
                      </blockquote>
                    )}
                  </li>
                );
              })}
            </ol>
            {rest.length > 0 && (
              <div className="mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-expanded={openRest.includes(t)}
                  onClick={() => setOpenRest((x) => (x.includes(t) ? x.filter((y) => y !== t) : [...x, t]))}
                  className="text-muted-foreground"
                >
                  <ShieldCheck data-icon="inline-start" className="text-success" />
                  {rest.length} other {rest.length === 1 ? "clause" : "clauses"} read, nothing flagged
                  <ChevronDown className={cn("transition-transform duration-(--duration-fast)", openRest.includes(t) && "rotate-180")} aria-hidden />
                </Button>
                {openRest.includes(t) && (
                  <ul className="mt-2 flex flex-col gap-2 pl-3">
                    {rest.map((c) => (
                      <li key={c.id} className="font-document text-[14px] leading-[1.7] text-foreground/80">
                        <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                        <span className="font-sans text-[13px] font-medium text-foreground">{c.heading}.</span> {c.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

/* ---------- 3. Annotated: contents, the document, and notes in the margin ---------- */

export function Annotated() {
  const order = [...flagged];
  const [at, setAt] = useState(0);
  const current = order[at];
  const docRef = useRef<HTMLElement>(null);
  const go = (i: number) => {
    const n = (i + order.length) % order.length;
    setAt(n);
    scrollToClause(order[n].id);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      {/* Contents with risk badges per part */}
      <nav aria-label="Contents" className="hidden lg:block">
        <ol className="sticky top-(--page-bar-offset) flex flex-col gap-0.5 text-sm">
          {parts.map((p) => {
            const worst = p.clauses.filter((c) => c.plain && c.risk).sort((a, b) => riskOrder[a.risk!] - riskOrder[b.risk!])[0];
            return (
              <li key={p.number}>
                <button
                  type="button"
                  onClick={() => scrollToClause(p.clauses[0].id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-(--duration-fast) hover:bg-muted"
                >
                  <span className="tnum w-5 shrink-0 text-xs text-muted-foreground">{p.number}</span>
                  <span className="min-w-0 flex-1 truncate">{p.title}</span>
                  {worst && (
                    <span
                      className={cn("size-2 shrink-0 rounded-full", worst.risk === "high" ? "bg-critical" : worst.risk === "medium" ? "bg-(--timeline-notice)" : "bg-success")}
                      aria-label={riskLabel[worst.risk!]}
                      role="img"
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0">
        {/* Step through the risks */}
        <div className="sticky top-(--page-bar-offset) z-(--z-sticky) mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card px-4 py-2.5 shadow-card">
          <p className="flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
            <RiskBadge risk={current.risk!} />
            <span className="truncate">
              <span className="tnum font-medium">
                {at + 1} of {order.length}
              </span>{" "}
              · {current.heading}
            </span>
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => go(at - 1)}>
              <ChevronUp data-icon="inline-start" /> Previous risk
            </Button>
            <Button variant="outline" size="sm" onClick={() => go(at + 1)}>
              <ChevronDown data-icon="inline-start" /> Next risk
            </Button>
          </div>
        </div>

        <article ref={docRef} className="rounded-xl bg-card px-6 py-8 shadow-card sm:px-8" aria-label={`${contract.title}: contract text`}>
          <p className="mb-8 text-center text-xs tracking-[0.12em] text-muted-foreground uppercase">Agreement</p>
          {parts.map((p) => (
            <section key={p.number} className="mb-6">
              <h3 className="mb-2 text-sm font-medium">
                {p.number}. {p.title}
              </h3>
              {p.clauses.map((c) => {
                const note = c.plain && c.risk;
                const isCurrent = current.id === c.id;
                return (
                  <div key={c.id} className="grid gap-x-6 gap-y-2 py-1.5 md:grid-cols-[minmax(0,1fr)_15rem]">
                    <p
                      id={`clause-${c.id}`}
                      tabIndex={-1}
                      className={cn(
                        "scroll-mt-36 rounded-md px-2 py-1 font-document text-[14px] leading-[1.7] text-foreground/85",
                        note && riskTint[c.risk!],
                        isCurrent && "ring-2 ring-(--control-focus-edge)",
                      )}
                    >
                      <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                      <span className="font-sans text-[13px] font-medium text-foreground">{c.heading}.</span> {c.text}
                    </p>
                    {note ? (
                      <aside className={cn("rounded-lg border-l-2 bg-background py-1 pl-3 text-sm", riskEdge[c.risk!])} aria-label={`Note on clause ${c.number}`}>
                        <RiskBadge risk={c.risk!} />
                        <p className="mt-1.5 text-pretty">{c.plain}</p>
                        {c.action && (
                          <Link href={c.action.href} className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                            {c.action.label} <ArrowRight className="size-3.5" aria-hidden />
                          </Link>
                        )}
                      </aside>
                    ) : (
                      <span className="hidden md:block" />
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </article>
      </div>
    </div>
  );
}
