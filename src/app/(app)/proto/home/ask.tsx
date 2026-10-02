"use client";
// Throwaway: /proto/home variant "Ask". The agent leads: ask, or read its brief.
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { answer, type Answer } from "@/lib/answers";
import { contracts, decisions } from "@/lib/data";
import { daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { ClauseLink, PageHeader } from "@/components/contravo/primitives";
import { PromptComposer } from "@/components/ui/prompt-composer";
import { PromptSuggestion, PromptSuggestions } from "@/components/ui/prompt-suggestion";
import { Spinner } from "@/components/ui/spinner";
import { committing, foi, recoverable, toReview } from "./shared";

const top = [...decisions].sort((a, b) => a.due.localeCompare(b.due));
const title = (id: string) => contracts.find((c) => c.id === id)!.title;

/** Suggestions written from the estate itself, not generic examples */
const estateSuggestions = [
  `Draft the objection to Corvel’s 9.4% price rise`,
  `What happens if we miss the ${formatDate(top[1].due, { year: false })} notice date?`,
  "Which contracts renew automatically in the next 6 months?",
  "Are we paying for anything twice?",
];

const tone = (d: number) => (d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground");

export function Ask() {
  const [draft, setDraft] = useState("");
  const [q, setQ] = useState<string | null>(null);
  const [a, setA] = useState<Answer | null>(null);
  const busy = q !== null && a === null;

  function ask(text: string) {
    setQ(text);
    setA(null);
    setDraft("");
    setTimeout(() => setA(answer(text)), 1100);
  }

  return (
    <div>
      <PageHeader title="Good morning, Priya">Ask anything about your contracts, or start with what changed.</PageHeader>

      <div className="mt-6 flex flex-col gap-4">
        <PromptComposer
          aria-label="Ask about your contracts"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about your contracts: dates, obligations, parties, values."
          isLoading={busy}
          loadingText="Reading your contracts…"
          blobTranslucent
          rows={2}
          onSend={() => ask(draft.trim())}
        />
        <PromptSuggestions aria-label="Suggested questions">
          {estateSuggestions.map((s) => (
            <PromptSuggestion key={s} onClick={() => ask(s)}>
              {s}
            </PromptSuggestion>
          ))}
        </PromptSuggestions>
      </div>

      {q && (
        <section aria-live="polite" className="mt-6 rounded-xl bg-card p-5 shadow-card">
          <p className="text-sm font-medium">{q}</p>
          {a ? (
            <>
              <div className="mt-3 flex max-w-[68ch] flex-col gap-3 text-[15px] leading-relaxed">
                {a.body.map((p, i) => (
                  <p key={i}>{p.replace(/\s?\[\d+\]/g, "")}</p>
                ))}
              </div>
              {a.sources.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.sources.map((s) => (
                    <ClauseLink key={s.contractId + s.clauseId} contractId={s.contractId} clause={s.clauseId} contractTitle={title(s.contractId)} />
                  ))}
                </div>
              )}
              <Link href={`/chat?q=${encodeURIComponent(q)}`} className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline">
                Continue in Chat <ArrowRight className="size-4" aria-hidden />
              </Link>
            </>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground" role="status">
              <Spinner /> Reading 21 contracts…
            </p>
          )}
        </section>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="brief-h">
          <h2 id="brief-h" className="flex items-center gap-2 text-base font-medium">
            <Sparkles className="size-4 text-muted-foreground" aria-hidden /> Your morning brief
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Written by Contravo from last night’s check of every contract. Each point links to its clause.</p>
          <ol className="mt-4 flex flex-col gap-4">
            <li className="max-w-[68ch]">
              <p className="text-pretty">
                <strong className="font-medium">{top[0].title}.</strong> It’s the most urgent thing this week: {daysLeft(daysUntil(top[0].due)).toLowerCase()}.
              </p>
              {top[0].clauseId && <ClauseLink contractId={top[0].contractId} clause={top[0].clauseId} contractTitle={title(top[0].contractId)} />}
            </li>
            <li className="max-w-[68ch]">
              <p className="text-pretty">
                <strong className="tnum font-medium">{gbp(committing)}</strong> commits automatically this month unless someone gives notice, across{" "}
                {decisions.filter((d) => d.kind === "notice" && daysUntil(d.due) <= 31).length} contracts.
              </p>
            </li>
            <li className="max-w-[68ch]">
              <p className="text-pretty">
                <strong className="tnum font-medium">{gbp(recoverable)}</strong> may be recoverable: VAT not reclaimed and a service paid for twice. Finance needs to confirm.
              </p>
            </li>
            <li className="max-w-[68ch]">
              <p className="text-pretty">
                {toReview.length} new contracts are read and waiting for you to check what the AI found.{" "}
                <Link href={`/contracts/${toReview[0]?.id}/review`} className="font-medium text-primary underline-offset-4 hover:underline">
                  Check the first one
                </Link>
              </p>
            </li>
          </ol>
        </section>

        <aside aria-labelledby="due-h">
          <h2 id="due-h" className="mb-3 text-sm font-medium">
            Coming up
          </h2>
          <ol className="flex flex-col divide-y rounded-xl bg-card shadow-card">
            {[...top.slice(0, 4).map((d) => ({ id: d.id, t: d.title, ctx: title(d.contractId), days: daysUntil(d.due), href: `/contracts/${d.contractId}` })), ...foi.slice(0, 2).map((v) => ({ id: v.id, t: v.next, ctx: v.ref, days: v.daysLeft, href: `/foi/${v.id}` }))]
              .sort((x, y) => x.days - y.days)
              .map((r) => (
                <li key={r.id}>
                  <Link href={r.href} className="block px-4 py-3 transition-colors duration-(--duration-fast) hover:bg-muted/60">
                    <span className={cn("tnum text-xs font-medium", tone(r.days))}>{daysLeft(r.days)}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm font-medium">{r.t}</span>
                    <span className="block truncate text-xs text-muted-foreground">{r.ctx}</span>
                  </Link>
                </li>
              ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
