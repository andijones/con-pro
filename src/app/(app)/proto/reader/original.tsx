"use client";
// Throwaway: /proto/reader. The contract reader as it was before Risk map, kept for comparison.

import { useEffect, useRef, useState } from "react";
import { FileText, Upload } from "lucide-react";
import type { Clause } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

const riskTone = { high: "bg-critical", medium: "bg-warning", low: "bg-success" } as const;

/**
 * Left: every clause that carries meaning, in plain English.
 * Right: the document itself. Selecting either side keeps the other in step,
 * so the evidence is never more than a glance away.
 */
export function OriginalReader({
  clauses,
  initial,
  title,
  pages,
}: {
  clauses: Clause[];
  initial?: string;
  title: string;
  pages: { held: number; total: number | null };
}) {
  const [active, setActive] = useState<string | undefined>(initial ?? clauses.find((c) => c.risk === "high")?.id);
  const docRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Arriving with ?clause= (from a citation): bring the reader into view
  useEffect(() => {
    if (initial) rootRef.current?.scrollIntoView({ block: "start" });
  }, [initial]);

  useEffect(() => {
    if (!active) return;
    const el = docRef.current?.querySelector<HTMLElement>(`[data-clause="${CSS.escape(active)}"]`);
    if (el && docRef.current) docRef.current.scrollTo({ top: el.offsetTop - 24, behavior: initial ? "auto" : "smooth" });
  }, [active, initial]);

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

  const explained = clauses.filter((c) => c.plain);

  return (
    <div ref={rootRef} className="grid scroll-mt-20 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div>
        <h2 className="mb-3 text-sm font-medium">
          What the contract says <span className="font-normal text-muted-foreground">· in plain English</span>
        </h2>
        <ul className="flex flex-col gap-2">
          {explained.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setActive(c.id)}
                aria-pressed={active === c.id}
                className={cn(
                  "w-full rounded-lg bg-card p-4 text-left transition-shadow duration-(--duration-fast)",
                  active === c.id ? "shadow-[0_0_0_2px_var(--ring),0_0_0_6px_color-mix(in_oklab,var(--ring)_18%,transparent)]" : "shadow-card hover:shadow-raised",
                )}
              >
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.heading}</span>
                  <span>· Clause {c.number}</span>
                  {/* WCAG 1.4.1: risk is spelled out, not shown by colour alone */}
                  {c.risk && (
                    <span className="ml-auto inline-flex items-center gap-1.5">
                      <span className={cn("size-1.5 rounded-full", riskTone[c.risk])} aria-hidden />
                      {c.risk === "high" ? "High risk" : c.risk === "medium" ? "Medium risk" : "Low risk"}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block text-[15px] leading-relaxed text-pretty">{c.plain}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Card className="gap-0 py-0 lg:sticky lg:top-(--page-bar-offset) lg:self-start">
        <div className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{title}.pdf</span>
          </span>
          {pages.total && pages.held < pages.total ? (
            <Badge variant="warning" className="tnum">
              {pages.held} of {pages.total} pages held
            </Badge>
          ) : (
            <span className="tnum text-xs text-muted-foreground">{pages.held} pages</span>
          )}
        </div>
        <div ref={docRef} tabIndex={0} role="region" aria-label={`${title}: contract text`} className="relative max-h-[70vh] overflow-y-auto bg-muted/60 p-4 sm:p-6">
          <article className="mx-auto max-w-[62ch] rounded-sm bg-background px-6 py-8 font-document text-[14px] leading-[1.7] text-foreground/90 shadow-sm sm:px-10">
            <p className="mb-6 text-center font-sans text-xs tracking-[0.12em] text-muted-foreground uppercase">Agreement</p>
            {clauses.map((c) => (
              <section
                key={c.id}
                data-clause={c.id}
                data-active={active === c.id}
                onClick={() => c.plain && setActive(c.id)}
                className={cn("relative -mx-3 mb-4 px-3 py-1.5", c.plain && "clause-mark cursor-pointer")}
              >
                <p>
                  <span className="mr-2 font-sans text-xs font-medium text-muted-foreground">{c.number}</span>
                  <span className="font-sans text-[13px] font-medium">{c.heading}.</span> {c.text}
                </p>
              </section>
            ))}
            <p className="mt-8 text-center font-sans text-xs text-muted-foreground">
              Extract shown. Clauses without a plain-English note were read and have no flagged risk.
            </p>
          </article>
        </div>
      </Card>
    </div>
  );
}
