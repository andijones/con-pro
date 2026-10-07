"use client";

/**
 * The contract, read for you ("Risk map" with the navigator rail). One scroll through the agreement: the whole
 * document where it's held (part by part), otherwise the extracted clauses. Every flagged clause is tinted by risk,
 * carries a risk badge and its plain-English meaning above the original wording, and links to any decision it drives.
 * The navigator rail on the right steps through the flagged clauses in order and shows which one you're reading;
 * on phones a compact bar under the contract does the same.
 * Decision record: docs/decisions/contract-reader.md
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, FileText, Upload } from "lucide-react";
import type { Clause } from "@/lib/data";
import { decisions } from "@/lib/data";
import type { DocumentPart } from "@/lib/contract-documents";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Risk = NonNullable<Clause["risk"]>;
type Flag = Clause & { risk: Risk; plain: string };
const RISKS: Risk[] = ["high", "medium", "low"];
const label: Record<Risk, string> = { high: "High risk", medium: "Medium risk", low: "Low risk" };
/** Design-system Badge variants; the words are always shown, so colour is never the only signal (WCAG 1.4.1) */
const badge: Record<Risk, "critical" | "warning" | "success"> = { high: "critical", medium: "warning", low: "success" };
const tint: Record<Risk, string> = { high: "bg-critical-muted", medium: "bg-warning-muted", low: "bg-success-muted" };
const edge: Record<Risk, string> = { high: "border-critical", medium: "border-(--timeline-notice)", low: "border-success" };
const mark: Record<Risk, string> = { high: "bg-critical", medium: "bg-(--timeline-notice)", low: "bg-success" };
/** Rail stops are sized by level as well as coloured: bigger for higher risk */
const dot: Record<Risk, string> = { high: "size-2.5", medium: "size-2", low: "size-1.5" };

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const isFlag = (c: Clause): c is Flag => !!(c.plain && c.risk);

/** The element that scrolls the page: the inset panel's scroller on desktop, the window on phones */
function scrollerOf(el: HTMLElement | null): HTMLElement | Window {
  let p = el?.parentElement ?? null;
  while (p) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
    p = p.parentElement;
  }
  return window;
}

export function ContractReader({
  contractId,
  clauses,
  document: fullText,
  initial,
  title,
  pages,
}: {
  contractId: string;
  clauses: Clause[];
  /** The whole agreement, part by part, when it's held; otherwise the extracted clauses are shown */
  document?: DocumentPart[] | null;
  initial?: string;
  title: string;
  pages: { held: number; total: number | null };
}) {
  // Highlights, not a filter: the whole contract is always on screen
  const [show, setShow] = useState<"all" | Risk>("all");
  const [active, setActive] = useState<string | undefined>(initial);
  const [current, setCurrent] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const hold = useRef(0); // after a jump, that clause stays "current" until the scroll has settled

  const parts = useMemo<DocumentPart[]>(() => fullText ?? [{ number: "", title: "", clauses }], [fullText, clauses]);
  const all = useMemo(() => parts.flatMap((p) => p.clauses), [parts]);
  const flagged = useMemo(() => all.filter(isFlag), [all]);
  const count = (r: Risk) => flagged.filter((c) => c.risk === r).length;
  const lit = useCallback((c: Flag) => show === "all" || c.risk === show, [show]);
  const steps = useMemo(() => flagged.filter(lit), [flagged, lit]);
  const partial = pages.total != null && pages.held < pages.total;
  const decisionFor = (clauseId: string) => decisions.find((d) => d.contractId === contractId && d.clauseId === clauseId);

  const jump = useCallback((id: string) => {
    setActive(id);
    setCurrent(id);
    hold.current = Date.now() + 900;
    const el = document.getElementById(`clause-${id}`);
    el?.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
    el?.focus({ preventScroll: true });
  }, []);

  // Arriving from a citation (?clause=): show the whole contract and bring that clause into view
  // (after Next has finished restoring scroll for the navigation, or it would put us back at the top)
  useEffect(() => {
    if (!initial) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`clause-${initial}`);
      (el ?? rootRef.current)?.scrollIntoView({ block: el ? "center" : "start" });
      el?.focus({ preventScroll: true });
    }, 150);
    return () => clearTimeout(t);
  }, [initial]);

  // Which flagged clause you're reading: the one across the middle of the screen, else the nearest one in view
  useEffect(() => {
    if (!flagged.length) return;
    const s = scrollerOf(articleRef.current);
    let raf = 0;
    const read = () => {
      raf = 0;
      if (Date.now() < hold.current) return;
      const vp = s instanceof Window ? { top: 0, height: innerHeight } : { top: s.getBoundingClientRect().top, height: s.clientHeight };
      const mid = vp.top + vp.height / 2;
      let best: string | null = null;
      let dist = Infinity;
      for (const c of flagged) {
        const r = document.getElementById(`clause-${c.id}`)?.getBoundingClientRect();
        if (!r || r.bottom < vp.top || r.top > vp.top + vp.height) continue;
        const d = r.top <= mid && r.bottom >= mid ? -1 : Math.abs((r.top + r.bottom) / 2 - mid);
        if (d < dist) {
          dist = d;
          best = c.id;
        }
      }
      setCurrent(best);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    s.addEventListener("scroll", on, { passive: true });
    addEventListener("resize", on);
    return () => {
      s.removeEventListener("scroll", on);
      removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, [flagged]);

  if (!clauses.length && !fullText) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No clauses extracted yet</EmptyTitle>
          <EmptyDescription>
            This contract is in the register, but its clauses haven’t been extracted. Upload the signed copy to see clauses, dates and risks.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline">
            <Upload data-icon="inline-start" /> Upload signed copy
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div ref={rootRef} className="scroll-mt-24">
      <h2 className="section-title mb-3">
        What the contract says <span className="font-normal text-muted-foreground">· in plain English</span>
      </h2>

      {/* Summary and highlights */}
      <section aria-label="Summary" className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-card">
        <div className="min-w-0">
          <p className="text-base font-medium">
            {partial
              ? `Contravo read the ${all.length} ${all.length === 1 ? "clause" : "clauses"} on the ${pages.held} pages it holds.`
              : all.length === 1
                ? "Contravo read the contract’s 1 clause."
                : `Contravo read all ${all.length} clauses.`}{" "}
            {flagged.length ? `${flagged.length} ${flagged.length === 1 ? "needs" : "need"} your attention.` : "Nothing needs your attention."}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 shrink-0" aria-hidden />
            <span>{title}.pdf</span>
            {partial ? (
              <Badge variant="warning" className="tnum">
                {pages.held} of {pages.total} pages held
              </Badge>
            ) : (
              <span className="tnum">· {pages.held} pages</span>
            )}
          </p>
        </div>
        {flagged.length > 0 && (
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={show}
            onValueChange={(v) => {
              const next = (v as "all" | Risk) || "all";
              setShow(next);
              // Bring the first clause at that level into view; the rest of the contract stays put around it
              const first = next !== "all" && flagged.find((c) => c.risk === next);
              if (first) jump(first.id);
            }}
            aria-label="Highlight risks"
            className="flex-wrap"
          >
            <ToggleGroupItem value="all">All risks · {flagged.length}</ToggleGroupItem>
            {RISKS.filter((r) => count(r)).map((r) => (
              <ToggleGroupItem key={r} value={r}>
                {label[r]} · {count(r)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </section>

      <div className={cn("mt-6 grid gap-4", flagged.length > 0 && "md:grid-cols-[minmax(0,1fr)_3.5rem]")}>
        <div className="min-w-0">
          <article ref={articleRef} className="rounded-xl bg-card px-6 py-8 shadow-card sm:px-10" aria-label={`${title}: contract text`}>
            <p className="mb-8 text-center text-xs tracking-[0.12em] text-muted-foreground uppercase">Agreement</p>
            <div className="flex flex-col gap-8">
              {parts.map((p, pi) => (
                <section key={p.number || pi} aria-label={p.title ? `${p.number}. ${p.title}` : undefined}>
                  {p.title && (
                    <h3 className="mb-3 text-caption font-medium text-muted-foreground">
                      <span className="tnum mr-2">{p.number}</span>
                      {p.title}
                    </h3>
                  )}
                  <div className="flex flex-col gap-3">
                    {p.clauses.map((c) => {
                      const isActive = active === c.id;
                      if (isFlag(c)) {
                        const d = decisionFor(c.id);
                        return (
                          <div
                            key={c.id}
                            id={`clause-${c.id}`}
                            tabIndex={-1}
                            className={cn(
                              "scroll-mt-28 rounded-lg border-l-4 p-4 transition-[background-color,border-color] duration-(--duration-fast) ease-(--ease-out)",
                              // Highlighted risks are tinted; the rest stay readable with their badge, just quieter
                              lit(c) ? [edge[c.risk], tint[c.risk]] : "border-(--brand-line) bg-transparent",
                              isActive && "shadow-[0_0_0_2px_var(--control-focus-edge)]",
                            )}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={badge[c.risk]}>{label[c.risk]}</Badge>
                              <span className="text-sm font-medium">{c.heading}</span>
                              <span className="text-xs text-muted-foreground">Clause {c.number}</span>
                            </div>
                            <p className="mt-2 text-base font-medium text-pretty">{c.plain}</p>
                            <p className="mt-3 font-document text-sm leading-[1.7] text-foreground/80">{c.text}</p>
                            {d && (
                              <Link
                                href={`#${d.id}`}
                                className="hit-area-y mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                              >
                                Needs a decision: {d.title} <ArrowRight className="size-3.5" aria-hidden />
                              </Link>
                            )}
                          </div>
                        );
                      }
                      return (
                        <p
                          key={c.id}
                          id={`clause-${c.id}`}
                          tabIndex={-1}
                          className={cn(
                            "scroll-mt-28 rounded-md px-4 py-1 font-document text-sm leading-[1.7] text-foreground/80",
                            isActive && "shadow-[0_0_0_2px_var(--control-focus-edge)]",
                          )}
                        >
                          <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                          <span className="font-sans text-caption font-medium text-foreground">{c.heading}.</span> {c.text}
                        </p>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <p className="mt-8 text-center text-xs text-muted-foreground">
              {partial ? "Extract shown. Clauses on the missing pages haven’t been read." : "Clauses without a note were read and have no flagged risk."}
            </p>
          </article>
          {flagged.length > 0 && <NavigatorBar steps={steps} current={current} onJump={jump} />}
        </div>

        {flagged.length > 0 && <NavigatorRail steps={steps} current={current} onJump={jump} />}
      </div>
    </div>
  );
}

/** Previous / next through the highlighted risks, from whichever one you're reading */
function useStepper(steps: Flag[], current: string | null, onJump: (id: string) => void) {
  const at = steps.findIndex((c) => c.id === current);
  const here = at >= 0 ? steps[at] : null;
  const go = (d: number) => {
    const next = steps[here ? at + d : d > 0 ? 0 : steps.length - 1];
    if (next) onJump(next.id);
  };
  return { at, here, go, first: !!here && at === 0, last: !!here && at === steps.length - 1 };
}

/* The navigator rail: the stepper stood on end, in a slim column beside the contract (from md) */
function NavigatorRail({ steps, current, onJump }: { steps: Flag[]; current: string | null; onJump: (id: string) => void }) {
  const { at, here, go, first, last } = useStepper(steps, current, onJump);
  if (!steps.length) return null;
  return (
    <nav aria-label="Step through the risks" className="hidden md:block">
      <div className="sticky top-(--page-bar-offset) flex flex-col items-center gap-1 rounded-full bg-card py-1.5 shadow-card">
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous risk" disabled={first} onClick={() => go(-1)}>
          <ChevronUp />
        </Button>
        <p className="tnum text-center text-micro leading-tight text-muted-foreground" aria-live="polite">
          {here ? (
            <>
              <span className="block text-sm font-medium text-foreground">{at + 1}</span>of {steps.length}
              <span className="sr-only">
                : {label[here.risk]}, {here.heading}, clause {here.number}
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium text-foreground">{steps.length}</span>
              {steps.length === 1 ? "risk" : "risks"}
            </>
          )}
        </p>
        {/* One stop per risk, in document order, on a thin track; the one you're reading grows */}
        <ol className="relative my-1 flex flex-col items-center">
          <span aria-hidden className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-border" />
          {steps.map((c) => {
            const on = current === c.id;
            return (
              <li key={c.id} className="relative">
                <button
                  type="button"
                  onClick={() => onJump(c.id)}
                  aria-label={`${label[c.risk]}: ${c.heading}, clause ${c.number}`}
                  aria-current={on ? "location" : undefined}
                  title={`${label[c.risk]} · ${c.heading} · ${c.number}`}
                  className="group grid size-7 place-items-center"
                >
                  <span
                    className={cn(
                      "rounded-full transition-[width,height,box-shadow,scale] duration-(--duration-fast) ease-(--ease-out) fine-hover:group-hover:scale-125",
                      mark[c.risk],
                      on ? "h-4 w-2.5 shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--control-focus-edge)]" : [dot[c.risk], "shadow-[0_0_0_2px_var(--card)]"],
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Next risk" disabled={last} onClick={() => go(1)}>
          <ChevronDown />
        </Button>
      </div>
    </nav>
  );
}

/* Phones have no room for the rail: the same stepper as a compact bar under the contract */
function NavigatorBar({ steps, current, onJump }: { steps: Flag[]; current: string | null; onJump: (id: string) => void }) {
  const { at, here, go, first, last } = useStepper(steps, current, onJump);
  if (!steps.length) return null;
  return (
    <div className="sticky bottom-4 z-(--z-sticky) mt-4 md:hidden">
      <nav aria-label="Step through the risks" className="flex items-center gap-2 rounded-xl bg-card/95 p-1.5 shadow-raised backdrop-blur-sm">
        <Button variant="ghost" size="icon" aria-label="Previous risk" disabled={first} onClick={() => go(-1)}>
          <ChevronUp />
        </Button>
        <p className="min-w-0 flex-1 text-sm" aria-live="polite">
          {here ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="tnum shrink-0 text-muted-foreground">
                {at + 1}/{steps.length}
              </span>
              <Badge variant={badge[here.risk]} className="shrink-0">
                {label[here.risk]}
              </Badge>
              <span className="truncate font-medium">{here.heading}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              <span className="tnum">{steps.length}</span> {steps.length === 1 ? "risk" : "risks"} to step through
            </span>
          )}
        </p>
        <Button variant="ghost" size="icon" aria-label="Next risk" disabled={last} onClick={() => go(1)}>
          <ChevronDown />
        </Button>
      </nav>
    </div>
  );
}
