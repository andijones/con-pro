"use client";

/**
 * The contract, read for you ("Risk map"). One scroll through the whole agreement: every flagged clause is tinted by
 * risk, carries a risk badge and its plain-English meaning above the original wording, and links to any decision it
 * drives. A map down the side shows where the risks fall and jumps to them.
 * Decision record: docs/decisions/contract-reader.md
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, FileText, Upload } from "lucide-react";
import type { Clause } from "@/lib/data";
import { decisions } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Risk = NonNullable<Clause["risk"]>;
const RISKS: Risk[] = ["high", "medium", "low"];
const label: Record<Risk, string> = { high: "High risk", medium: "Medium risk", low: "Low risk" };
/** Design-system Badge variants; the words are always shown, so colour is never the only signal (WCAG 1.4.1) */
const badge: Record<Risk, "critical" | "warning" | "success"> = { high: "critical", medium: "warning", low: "success" };
const tint: Record<Risk, string> = { high: "bg-critical-muted", medium: "bg-warning-muted", low: "bg-success-muted" };
const edge: Record<Risk, string> = { high: "border-critical", medium: "border-(--timeline-notice)", low: "border-success" };
const mark: Record<Risk, string> = { high: "bg-critical", medium: "bg-(--timeline-notice)", low: "bg-success" };

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ContractReader({
  contractId,
  clauses,
  initial,
  title,
  pages,
}: {
  contractId: string;
  clauses: Clause[];
  initial?: string;
  title: string;
  pages: { held: number; total: number | null };
}) {
  // Highlights, not a filter: the whole contract is always on screen
  const [show, setShow] = useState<"all" | Risk>("all");
  const [active, setActive] = useState<string | undefined>(initial);
  const rootRef = useRef<HTMLDivElement>(null);

  const flagged = clauses.filter((c) => c.plain && c.risk);
  const count = (r: Risk) => flagged.filter((c) => c.risk === r).length;
  const lit = (c: Clause) => show === "all" || c.risk === show;
  const partial = pages.total != null && pages.held < pages.total;
  const decisionFor = (clauseId: string) => decisions.find((d) => d.contractId === contractId && d.clauseId === clauseId);

  function jump(id: string) {
    setActive(id);
    const el = document.getElementById(`clause-${id}`);
    el?.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
    el?.focus({ preventScroll: true });
  }

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

  if (!clauses.length) {
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

      {/* Summary and filters */}
      <section aria-label="Summary" className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-5 shadow-card">
        <div className="min-w-0">
          <p className="text-base font-medium">
            {partial
              ? `Contravo read the ${clauses.length} ${clauses.length === 1 ? "clause" : "clauses"} on the ${pages.held} pages it holds.`
              : clauses.length === 1
                ? "Contravo read the contract’s 1 clause."
                : `Contravo read all ${clauses.length} clauses.`}{" "}
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
          <ToggleGroup type="single" variant="outline" size="sm" value={show} onValueChange={(v) => {
              const next = (v as "all" | Risk) || "all";
              setShow(next);
              // Bring the first clause at that level into view; the rest of the contract stays put around it
              const first = next !== "all" && flagged.find((c) => c.risk === next);
              if (first) jump(first.id);
            }} aria-label="Highlight risks" className="flex-wrap">
            <ToggleGroupItem value="all">All risks · {flagged.length}</ToggleGroupItem>
            {RISKS.filter((r) => count(r)).map((r) => (
              <ToggleGroupItem key={r} value={r}>
                {label[r]} · {count(r)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-[minmax(0,1fr)_2.5rem]">
        <article className="min-w-0 rounded-xl bg-card px-6 py-8 shadow-card sm:px-10" aria-label={`${title}: contract text`}>
          <p className="mb-8 text-center text-xs tracking-[0.12em] text-muted-foreground uppercase">Agreement</p>
          <div className="flex flex-col gap-3">
            {clauses.map((c) => {
              const isActive = active === c.id;
              if (c.plain && c.risk) {
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
                    <p className="mt-3 font-document text-[14px] leading-[1.7] text-foreground/80">{c.text}</p>
                    {d && (
                      <Link href={`#${d.id}`} className="hit-area-y mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
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
                  className={cn("scroll-mt-28 rounded-md px-4 py-1 font-document text-[14px] leading-[1.7] text-foreground/80", isActive && "shadow-[0_0_0_2px_var(--control-focus-edge)]")}
                >
                  <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                  <span className="font-sans text-[13px] font-medium text-foreground">{c.heading}.</span> {c.text}
                </p>
              );
            })}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            {partial ? "Extract shown. Clauses on the missing pages haven’t been read." : "Clauses without a note were read and have no flagged risk."}
          </p>
        </article>

        {/* The map: one notch per clause, coloured where Contravo flagged something */}
        {flagged.length > 0 && (
          <nav aria-label="Where the risks are" className="hidden md:block">
            <ol className="sticky top-(--page-bar-offset) flex flex-col gap-0.5 rounded-full bg-muted p-1.5">
              {clauses.map((c) =>
                c.plain && c.risk ? (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => jump(c.id)}
                      aria-label={`${label[c.risk]}: ${c.heading}, clause ${c.number}`}
                      title={`${label[c.risk]} · ${c.heading}`}
                      className={cn("block h-6 w-full rounded-full transition-transform duration-(--duration-fast) hover:scale-x-125", mark[c.risk])}
                    />
                  </li>
                ) : (
                  <li key={c.id} aria-hidden className="h-1.5 rounded-full bg-border" />
                ),
              )}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}
