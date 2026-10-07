"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgePoundSterling, CalendarClock, FileQuestion, Landmark, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { Decision, DecisionKind } from "@/lib/data";
import { contracts, people } from "@/lib/data";
import { gbp } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClauseLink, Countdown, PersonAvatar } from "./primitives";

export const kindMeta: Record<DecisionKind, { label: string; icon: typeof CalendarClock }> = {
  notice: { label: "Notice deadline", icon: CalendarClock },
  price: { label: "Price rise", icon: TrendingUp },
  money: { label: "Money to recover", icon: BadgePoundSterling },
  gap: { label: "Missing information", icon: FileQuestion },
  procurement: { label: "Procurement route", icon: Landmark },
};

export function DecisionList({ items }: { items: Decision[] }) {
  const [handled, setHandled] = useState<string[]>([]);

  function markHandled(d: Decision) {
    setHandled((h) => [...h, d.id]);
    toast("Marked as handled", {
      description: d.title,
      action: { label: "Undo", onClick: () => setHandled((h) => h.filter((x) => x !== d.id)) },
      duration: Infinity, // WCAG 2.2.1: no time limit on Undo
    });
  }

  return (
    <ol className="flex flex-col gap-3">
      {items
        .filter((d) => !handled.includes(d.id))
        .map((d) => {
          const c = contracts.find((x) => x.id === d.contractId)!;
          const k = kindMeta[d.kind];
          return (
            <li key={d.id} id={d.id} className="scroll-mt-16 md:scroll-mt-8">
              <Card className="grid gap-x-6 gap-y-4 p-5 transition-shadow duration-(--duration-fast) hover:shadow-raised sm:grid-cols-[132px_1fr]">
                <div className="sm:border-r sm:pr-5">
                  <Countdown date={d.due} label={d.dueLabel} />
                </div>

                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <k.icon className="size-3.5 text-primary" aria-hidden />
                      {k.label}
                    </span>
                    <span aria-hidden>·</span>
                    <Link href={`/contracts/${c.id}`} className="truncate underline decoration-muted-foreground/40 hover:text-primary hover:decoration-primary">
                      {c.title}
                    </Link>
                  </div>

                  <h3 className="text-lg leading-snug font-medium text-balance">{d.title}</h3>
                  <p className="mt-1.5 max-w-[68ch] text-reading leading-relaxed text-pretty text-muted-foreground">{d.detail}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                    {d.clauseId && <ClauseLink contractId={c.id} clause={d.clauseId} />}
                    {d.impact && (
                      <span className="text-caption text-muted-foreground">
                        <span className="tnum font-medium text-foreground">{gbp(d.impact.amount)}</span> {d.impact.label}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
                      <PersonAvatar id={d.owner} className="size-5" decorative />
                      {people[d.owner].name.replace(/^Dr /, "")}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button>
                      {d.actions.primary}
                      <ArrowRight data-icon="inline-end" />
                    </Button>
                    {d.actions.secondary && <Button variant="outline">{d.actions.secondary}</Button>}
                    <Button variant="ghost" onClick={() => markHandled(d)}>
                      Mark handled
                    </Button>
                  </div>
                </div>
              </Card>
            </li>
          );
        })}
    </ol>
  );
}
