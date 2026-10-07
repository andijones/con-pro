"use client";
// Throwaway: /proto/risk-map. The whole agreement (real flagged clauses among unflagged ones), with a swappable map.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { decisions } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { all, contract, flagged, parts, riskBadge, riskEdge, riskLabel, riskTint, type DocClause, type Risk } from "../reader/doc";

const RISKS: Risk[] = ["high", "medium", "low"];
/** Colour is never the only signal: each level also has its own mark length (WCAG 1.4.1) */
const markWidth: Record<Risk, string> = { high: "w-full", medium: "w-2/3", low: "w-1/3" };
/** Rail dots: bigger for higher risk, so size carries the level as well as colour */
const dotSize: Record<Risk, string> = { high: "size-2.5", medium: "size-2", low: "size-1.5" };
const markBg: Record<Risk, string> = { high: "bg-critical", medium: "bg-(--timeline-notice)", low: "bg-success" };
const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

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
const viewportOf = (s: HTMLElement | Window) => (s instanceof Window ? { top: 0, height: innerHeight } : { top: s.getBoundingClientRect().top, height: s.clientHeight });

export type MapKind = "minimap" | "index" | "navigator" | "rail";
type Flag = DocClause & { risk: Risk };

export function FullReader({ map }: { map: MapKind }) {
  const [show, setShow] = useState<"all" | Risk>("all");
  const [current, setCurrent] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const article = useRef<HTMLElement>(null);
  const hold = useRef(0); // after a jump, the jumped-to clause stays "current" until the scroll has settled
  const items = flagged as Flag[];
  const lit = useCallback((c: Flag) => show === "all" || c.risk === show, [show]);
  const steps = useMemo(() => items.filter(lit), [items, lit]);
  const decisionFor = (id: string) => decisions.find((d) => d.contractId === contract.id && d.clauseId === id);

  const jump = useCallback((id: string) => {
    setActive(id);
    setCurrent(id);
    hold.current = Date.now() + 900;
    const el = document.getElementById(`clause-${id}`);
    el?.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
    el?.focus({ preventScroll: true });
  }, []);

  // Scrollspy: the flagged clause nearest the middle of the screen is "current"
  useEffect(() => {
    const s = scrollerOf(article.current);
    let raf = 0;
    const read = () => {
      raf = 0;
      if (Date.now() < hold.current) return;
      const vp = viewportOf(s);
      const mid = vp.top + vp.height * 0.5;
      let best: string | null = null;
      let dist = Infinity;
      for (const c of items) {
        const r = document.getElementById(`clause-${c.id}`)?.getBoundingClientRect();
        if (!r || r.bottom < vp.top || r.top > vp.top + vp.height) continue;
        // A card that covers the middle line wins outright; otherwise the nearest one
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
  }, [items]);

  const withSide = map !== "navigator";

  return (
    <div className="py-6">
      <h2 className="section-title mb-3">
        What the contract says <span className="font-normal text-muted-foreground">· in plain English</span>
      </h2>

      <section aria-label="Summary" className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-card">
        <div className="min-w-0">
          <p className="text-base font-medium">
            Contravo read all {all.length} clauses. {items.length} need your attention.
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 shrink-0" aria-hidden />
            <span>{contract.title}.pdf</span>
            <span className="tnum">· {contract.pages.held} pages</span>
          </p>
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={show}
          onValueChange={(v) => {
            const next = (v as "all" | Risk) || "all";
            setShow(next);
            const first = next !== "all" && items.find((c) => c.risk === next);
            if (first) jump(first.id);
          }}
          aria-label="Highlight risks"
          className="flex-wrap"
        >
          <ToggleGroupItem value="all">All risks · {items.length}</ToggleGroupItem>
          {RISKS.filter((r) => items.some((c) => c.risk === r)).map((r) => (
            <ToggleGroupItem key={r} value={r}>
              {riskLabel[r]} · {items.filter((c) => c.risk === r).length}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </section>

      <div className={cn("mt-6 grid gap-6", withSide && (map === "index" ? "xl:grid-cols-[minmax(0,1fr)_16rem]" : map === "rail" ? "md:grid-cols-[minmax(0,1fr)_3.5rem]" : "md:grid-cols-[minmax(0,1fr)_3rem]"))}>
        <div className="min-w-0">
          <article ref={article} className="rounded-xl bg-card px-6 py-8 shadow-card sm:px-10" aria-label={`${contract.title}: contract text`}>
            <p className="mb-8 text-center text-xs tracking-[0.12em] text-muted-foreground uppercase">Agreement</p>
            <div className="flex flex-col gap-8">
              {parts.map((p) => (
                <section key={p.number} aria-label={`${p.number}. ${p.title}`}>
                  <h3 className="mb-3 text-[13px] font-medium text-muted-foreground">
                    <span className="tnum mr-2">{p.number}</span>
                    {p.title}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {p.clauses.map((c) =>
                      c.plain && c.risk ? (
                        <FlagCard key={c.id} c={c as Flag} on={lit(c as Flag)} active={active === c.id} decision={decisionFor(c.id)} />
                      ) : (
                        <p
                          key={c.id}
                          id={`clause-${c.id}`}
                          tabIndex={-1}
                          className="scroll-mt-28 px-4 font-document text-[14px] leading-[1.7] text-foreground/80"
                        >
                          <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                          <span className="font-sans text-[13px] font-medium text-foreground">{c.heading}.</span> {c.text}
                        </p>
                      ),
                    )}
                  </div>
                </section>
              ))}
            </div>
          </article>
          {map === "navigator" && <Navigator steps={steps} current={current} onJump={jump} />}
        </div>

        {map === "minimap" && <Minimap items={items} lit={lit} current={current} article={article} onJump={jump} />}
        {map === "index" && <Index items={items} lit={lit} current={current} onJump={jump} />}
        {map === "rail" && <NavRail steps={steps} current={current} onJump={jump} />}
      </div>
    </div>
  );
}

function FlagCard({ c, on, active, decision }: { c: Flag; on: boolean; active: boolean; decision?: (typeof decisions)[number] }) {
  return (
    <div
      id={`clause-${c.id}`}
      tabIndex={-1}
      className={cn(
        "scroll-mt-28 rounded-lg border-l-4 p-4 transition-[background-color,border-color,box-shadow] duration-(--duration-fast) ease-(--ease-out)",
        on ? [riskEdge[c.risk], riskTint[c.risk]] : "border-(--brand-line) bg-transparent",
        active && "shadow-[0_0_0_2px_var(--control-focus-edge)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={riskBadge[c.risk]}>{riskLabel[c.risk]}</Badge>
        <span className="text-sm font-medium">{c.heading}</span>
        <span className="text-xs text-muted-foreground">Clause {c.number}</span>
      </div>
      <p className="mt-2 text-base font-medium text-pretty">{c.plain}</p>
      <p className="mt-3 font-document text-[14px] leading-[1.7] text-foreground/80">{c.text}</p>
      {decision && (
        <Link href={`/contracts/${contract.id}#${decision.id}`} className="hit-area-y mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
          Needs a decision: {decision.title} <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/* ---------- 1. Minimap: a strip the length of the document; marks where risks really sit, and where you are ---------- */

function Minimap({ items, lit, current, article, onJump }: { items: Flag[]; lit: (c: Flag) => boolean; current: string | null; article: React.RefObject<HTMLElement | null>; onJump: (id: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Record<string, number>>({});
  const [view, setView] = useState({ top: 0, height: 0.2 });

  // Where each flagged clause sits, as a fraction of the article; marks too close to tap separately are nudged apart
  useEffect(() => {
    const a = article.current;
    if (!a) return;
    const measure = () => {
      const ar = a.getBoundingClientRect();
      const th = track.current?.clientHeight ?? 1;
      const minGap = 28 / th;
      const raw = items.map((c) => {
        const r = document.getElementById(`clause-${c.id}`)!.getBoundingClientRect();
        return { id: c.id, f: (r.top + r.height / 2 - ar.top) / ar.height };
      });
      const out: Record<string, number> = {};
      let last = -1;
      for (const { id, f } of raw) {
        const v = Math.max(f, last + minGap);
        out[id] = Math.min(v, 1);
        last = v;
      }
      setPos(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(a);
    return () => ro.disconnect();
  }, [items, article]);

  // The window: which part of the agreement is on screen
  useEffect(() => {
    const a = article.current;
    if (!a) return;
    const s = scrollerOf(a);
    let raf = 0;
    const read = () => {
      raf = 0;
      const ar = a.getBoundingClientRect();
      const vp = viewportOf(s);
      const top = Math.min(Math.max((vp.top - ar.top) / ar.height, 0), 1);
      const bottom = Math.min(Math.max((vp.top + vp.height - ar.top) / ar.height, 0), 1);
      setView({ top, height: Math.max(bottom - top, 0.02) });
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
  }, [article]);

  /** Pointer shortcut: click the strip to go to that point in the document. Keyboard users have the marks. */
  function goTo(e: React.MouseEvent) {
    const a = article.current;
    const t = track.current;
    if (!a || !t || e.target !== e.currentTarget) return;
    const f = (e.clientY - t.getBoundingClientRect().top) / t.clientHeight;
    const s = scrollerOf(a);
    const vp = viewportOf(s);
    const y = a.getBoundingClientRect().top - vp.top + f * a.offsetHeight - vp.height / 2;
    const by = { top: y, behavior: (reduced() ? "auto" : "smooth") as ScrollBehavior };
    if (s instanceof Window) scrollBy(by);
    else s.scrollBy(by);
  }

  return (
    <nav aria-label="Where the risks are" className="hidden md:block">
      <div className="sticky top-(--page-bar-offset) flex h-[calc(100dvh_-_var(--page-bar-offset)_-_3rem)] flex-col items-center gap-2">
        <span className="text-[11px] text-muted-foreground" aria-hidden>
          Start
        </span>
        <div ref={track} onClick={goTo} className="relative w-7 flex-1 cursor-pointer rounded-full bg-muted shadow-[inset_0_0_0_1px_var(--brand-line)]">
          {/* You are here */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0.5 rounded-full bg-foreground/[0.07] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--foreground)_18%,transparent)] transition-[top,height] duration-75"
            style={{ top: `${view.top * 100}%`, height: `${view.height * 100}%` }}
          />
          {items.map((c) =>
            pos[c.id] == null ? null : (
              <button
                key={c.id}
                type="button"
                onClick={() => onJump(c.id)}
                aria-label={`${riskLabel[c.risk]}: ${c.heading}, clause ${c.number}`}
                aria-current={current === c.id ? "location" : undefined}
                title={`${riskLabel[c.risk]} · ${c.heading} · ${c.number}`}
                className="group absolute inset-x-0 flex h-6 -translate-y-1/2 items-center justify-center"
                style={{ top: `${pos[c.id] * 100}%` }}
              >
                <span
                  className={cn(
                    "h-1.5 rounded-full transition-[opacity,transform,box-shadow] duration-(--duration-fast) ease-(--ease-out) group-hover:scale-y-150",
                    markWidth[c.risk],
                    markBg[c.risk],
                    !lit(c) && "opacity-30",
                    current === c.id && "shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--control-focus-edge)]",
                  )}
                />
              </button>
            ),
          )}
        </div>
        <span className="text-[11px] text-muted-foreground" aria-hidden>
          End
        </span>
      </div>
    </nav>
  );
}

/* ---------- 2. Index: the flagged clauses as a labelled list, the one you're reading highlighted ---------- */

function Index({ items, lit, current, onJump }: { items: Flag[]; lit: (c: Flag) => boolean; current: string | null; onJump: (id: string) => void }) {
  return (
    <nav aria-label="Flagged clauses" className="hidden xl:block">
      <div className="sticky top-(--page-bar-offset) rounded-xl bg-card p-2 shadow-card">
        <p className="px-2 pt-1.5 pb-2 text-xs text-muted-foreground">
          <span className="tnum">{items.length}</span> flagged in {all.length} clauses
        </p>
        <ol className="flex flex-col gap-0.5">
          {items.map((c) => {
            const here = current === c.id;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onJump(c.id)}
                  aria-current={here ? "location" : undefined}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-(--radius-inset) px-2 py-2 text-left transition-[background-color,opacity] duration-(--duration-fast) hover:bg-muted",
                    here && "bg-muted",
                    !lit(c) && "opacity-45",
                  )}
                >
                  <span className="mt-1.5 flex w-5 shrink-0" aria-hidden>
                    <span className={cn("h-1.5 rounded-full", markWidth[c.risk], markBg[c.risk])} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn("text-sm text-pretty", here ? "font-medium text-foreground" : "text-foreground/90")}>{c.heading}</span>
                      <span className="tnum shrink-0 text-xs text-muted-foreground">{c.number}</span>
                    </span>
                    <span className="block text-xs text-muted-foreground">{riskLabel[c.risk]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/* ---------- 3. Navigator: no side column; a stepper under the reading area names the risk you're on ---------- */

function Navigator({ steps, current, onJump }: { steps: Flag[]; current: string | null; onJump: (id: string) => void }) {
  const at = Math.max(
    0,
    steps.findIndex((c) => c.id === current),
  );
  const here = steps.find((c) => c.id === current) ?? null;
  const go = (d: number) => {
    const next = steps[current && here ? at + d : d > 0 ? 0 : steps.length - 1];
    if (next) onJump(next.id);
  };
  if (!steps.length) return null;
  return (
    <div className="sticky bottom-20 z-(--z-sticky) mt-4">
      {/* bottom-20 only to clear the prototype picker; in the app this sits at bottom-4 */}
      <nav aria-label="Step through the risks" className="mx-auto flex max-w-2xl items-center gap-3 rounded-xl bg-card/95 p-2 shadow-raised backdrop-blur-sm">
        <div className="flex shrink-0 items-center">
          <Button variant="ghost" size="icon" aria-label="Previous risk" disabled={!!here && at === 0} onClick={() => go(-1)}>
            <ChevronUp />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next risk" disabled={!!here && at === steps.length - 1} onClick={() => go(1)}>
            <ChevronDown />
          </Button>
        </div>
        <p className="min-w-0 flex-1 text-sm" aria-live="polite">
          {here ? (
            <span className="flex min-w-0 items-center gap-2">
              <span className="tnum shrink-0 text-muted-foreground">
                {at + 1} of {steps.length}
              </span>
              <Badge variant={riskBadge[here.risk]} className="shrink-0">
                {riskLabel[here.risk]}
              </Badge>
              <span className="truncate font-medium">{here.heading}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Clause {here.number}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              <span className="tnum">{steps.length}</span> {steps.length === 1 ? "risk" : "risks"} in this contract. Step through them in order.
            </span>
          )}
        </p>
        {/* Where they all are: one dot per risk, in document order */}
        <div className="hidden shrink-0 items-center gap-1 pr-2 sm:flex">
          {steps.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onJump(c.id)}
              aria-label={`${riskLabel[c.risk]}: ${c.heading}, clause ${c.number}`}
              aria-current={current === c.id ? "location" : undefined}
              className="grid size-6 place-items-center"
            >
              <span className={cn("rounded-full transition-[width,height] duration-(--duration-fast)", markBg[c.risk], current === c.id ? "h-2.5 w-4" : "size-2")} />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

/* ---------- 4. Navigator rail: the stepper stood on end, in a slim column on the right ---------- */

function NavRail({ steps, current, onJump }: { steps: Flag[]; current: string | null; onJump: (id: string) => void }) {
  const at = steps.findIndex((c) => c.id === current);
  const here = at >= 0 ? steps[at] : null;
  const go = (d: number) => {
    const next = steps[here ? at + d : d > 0 ? 0 : steps.length - 1];
    if (next) onJump(next.id);
  };
  if (!steps.length) return null;
  return (
    <nav aria-label="Step through the risks" className="hidden md:block">
      <div className="sticky top-(--page-bar-offset) flex flex-col items-center gap-1 rounded-full bg-card py-1.5 shadow-card">
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Previous risk" disabled={!!here && at === 0} onClick={() => go(-1)}>
          <ChevronUp />
        </Button>
        <p className="tnum text-center text-[11px] leading-tight text-muted-foreground" aria-live="polite">
          {here ? (
            <>
              <span className="block text-sm font-medium text-foreground">{at + 1}</span>of {steps.length}
              <span className="sr-only">
                : {riskLabel[here.risk]}, {here.heading}, clause {here.number}
              </span>
            </>
          ) : (
            <>
              <span className="block text-sm font-medium text-foreground">{steps.length}</span>risks
            </>
          )}
        </p>
        {/* One stop per risk, in document order, on a thin track; the current one grows */}
        <ol className="relative my-1 flex flex-col items-center">
          <span aria-hidden className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-border" />
          {steps.map((c) => {
            const on = current === c.id;
            return (
              <li key={c.id} className="relative">
                <button
                  type="button"
                  onClick={() => onJump(c.id)}
                  aria-label={`${riskLabel[c.risk]}: ${c.heading}, clause ${c.number}`}
                  aria-current={on ? "location" : undefined}
                  title={`${riskLabel[c.risk]} · ${c.heading} · ${c.number}`}
                  className="group grid size-7 place-items-center"
                >
                  <span
                    className={cn(
                      "rounded-full transition-[width,height,box-shadow] duration-(--duration-fast) ease-(--ease-out) group-hover:scale-125",
                      markBg[c.risk],
                      on ? "h-4 w-2.5 shadow-[0_0_0_2px_var(--card),0_0_0_4px_var(--control-focus-edge)]" : [dotSize[c.risk], "shadow-[0_0_0_2px_var(--card)]"],
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ol>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Next risk" disabled={!!here && at === steps.length - 1} onClick={() => go(1)}>
          <ChevronDown />
        </Button>
      </div>
    </nav>
  );
}

