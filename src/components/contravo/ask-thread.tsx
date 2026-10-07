"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarX2, Copy, Info, MessageSquare, RefreshCw, Thermometer, TrendingUp, type LucideIcon } from "lucide-react";
import { answer, suggestions, type Answer } from "@/lib/answers";
import { contracts, conversations, currentUser } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PromptComposer } from "@/components/ui/prompt-composer";
import { PromptSuggestion, PromptSuggestions } from "@/components/ui/prompt-suggestion";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { PersonAvatar } from "./primitives";
// Option A only (retired composer, commented out below):
// import { ArrowUp } from "lucide-react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { HaloShell } from "@/components/ui/halo-input";
// import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Turn = { id: number; q: string; a: Answer | null };

/** An icon per suggested question, so the grid scans by topic; anything new falls back to a speech bubble */
const suggestionIcon: Record<string, LucideIcon> = {
  "Which contracts let us end early without a penalty?": CalendarX2,
  "Who pays if the vaccine fridge fails?": Thermometer,
  "Which contracts renew automatically?": RefreshCw,
  "How do prices rise across our contracts?": TrendingUp,
  "Are we paying for anything twice?": Copy,
};
const MAX = 8000;

function clauseOf(contractId: string, clauseId: string) {
  const c = contracts.find((x) => x.id === contractId)!;
  return { contract: c, clause: c.clauses.find((k) => k.id === clauseId)! };
}

/** Renders "[n]" markers as citation buttons tied to the sources list. */
function Cited({ text, onCite, active }: { text: string; onCite: (n: number) => void; active: number | null }) {
  return (
    <>
      {text.split(/(\[\d+\])/g).map((p, i) => {
        const m = p.match(/^\[(\d+)\]$/);
        if (!m) return <Fragment key={i}>{p}</Fragment>;
        const n = Number(m[1]);
        return (
          <button
            key={i}
            onClick={() => onCite(n)}
            aria-label={`Source ${n}`}
            className={cn(
              "tnum mx-0.5 inline-grid h-[18px] min-w-[18px] -translate-y-px place-items-center rounded px-1 align-middle text-[11px] font-medium transition-colors",
              active === n ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            {n}
          </button>
        );
      })}
    </>
  );
}

/** `onThreadChange` tells the page when a conversation starts, so the greeting can step aside. */
export function AskThread({ onThreadChange }: { onThreadChange?: (inThread: boolean) => void } = {}) {
  const params = useSearchParams();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  // Option A only: const [scope, setScope] = useState("all");
  // Option A only: const [attachments, setAttachments] = useState(true);
  const [cite, setCite] = useState<{ turn: number; n: number } | null>(null);
  const seen = useRef<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  function ask(q: string) {
    const id = Date.now() + Math.random();
    setTurns((t) => [...t, { id, q, a: null }]);
    setTimeout(() => setTurns((t) => t.map((x) => (x.id === id ? { ...x, a: answer(q) } : x))), 1100);
  }

  useEffect(() => {
    const q = params.get("q");
    if (q && seen.current !== q) {
      seen.current = q;
      ask(q);
      router.replace("/chat", { scroll: false });
    }
  }, [params, router]);

  useEffect(() => {
    if (turns.length) bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns]);

  const busy = turns.some((t) => t.a === null);
  useEffect(() => onThreadChange?.(turns.length > 0), [turns.length, onThreadChange]);

  // Option A (retired 2 October 2026, kept to return to): the Halo shell around an InputGroup, with scope, attachments
  // and a character count. To restore, uncomment this block, the "Option A only" imports and state, and render {composerA}.
  //
  //   const composerA = (
  //     <form
  //       onSubmit={(e) => {
  //         e.preventDefault();
  //         if (draft.trim()) {
  //           ask(draft.trim());
  //           setDraft("");
  //         }
  //       }}
  //     >
  //       {/* The agent's input, in the Halo shell (@cult-ui/halo-input, brand colours): an opaque surface with the
  //           halo moving through its 1px rim. Frosted, so the colour glows softly through the surface; it quickens while an answer is being worked on. */}
  //       <HaloShell busy={busy} translucent>
  //         <InputGroup className="rounded-[10px] border-0! bg-transparent! shadow-none!">
  //         <InputGroupTextarea
  //           aria-label="Ask about your contracts"
  //           value={draft}
  //           maxLength={MAX}
  //           rows={turns.length ? 1 : 3}
  //           onChange={(e) => setDraft(e.target.value)}
  //           onKeyDown={(e) => {
  //             if (e.key === "Enter" && !e.shiftKey) {
  //               e.preventDefault();
  //               e.currentTarget.form?.requestSubmit();
  //             }
  //           }}
  //           placeholder={turns.length ? "Ask a follow-up" : "Ask about your contracts: dates, obligations, parties, values."}
  //           className="text-base md:text-sm"
  //         />
  //         <InputGroupAddon align="block-end" className="flex-wrap gap-x-3">
  //           <InputGroupText className="hidden text-xs sm:inline">Enter to send. Shift + Enter for a new line.</InputGroupText>
  //           <div className="ml-auto flex items-center gap-3">
  //             <Select value={scope} onValueChange={setScope}>
  //               <SelectTrigger size="sm" className="h-7 border-0 bg-transparent text-xs shadow-none" aria-label="Which contracts">
  //                 <SelectValue />
  //               </SelectTrigger>
  //               <SelectContent align="end">
  //                 <SelectItem value="all">All contracts</SelectItem>
  //                 <SelectItem value="active">Active only</SelectItem>
  //                 <SelectItem value="clinical">Clinical</SelectItem>
  //                 <SelectItem value="estates">Estates & Facilities</SelectItem>
  //               </SelectContent>
  //             </Select>
  //             <Label className="gap-1.5 text-xs font-normal text-muted-foreground">
  //               <Checkbox checked={attachments} onCheckedChange={(v) => setAttachments(!!v)} /> Include attachments
  //             </Label>
  //             <InputGroupText className="tnum text-xs">
  //               {draft.length} / {MAX}
  //             </InputGroupText>
  //             <InputGroupButton type="submit" variant="default" size="sm" disabled={!draft.trim()}>
  //               <ArrowUp /> Send
  //             </InputGroupButton>
  //           </div>
  //         </InputGroupAddon>
  //         </InputGroup>
  //       </HaloShell>
  //     </form>
  //   );

  /* The composer: Cult UI's Prompt Composer in brand tokens (components/ui/prompt-composer.tsx). Enter sends. */
  const composer = (
    <div>
      <PromptComposer
        aria-label="Ask about your contracts"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={turns.length ? "Ask a follow-up" : "Ask about your contracts: dates, obligations, parties, values."}
        isLoading={busy}
        loadingText="Reading your contracts…"
        rows={turns.length ? 2 : 4}
        maxLength={MAX}
        onSend={() => {
          ask(draft.trim());
          setDraft("");
        }}
        onAttach={() => toast("Attach a file (concept only)")}
      />
    </div>
  );

  // Empty state ("Focus" with the "Quiet list", docs/decisions/ask-composer.md): the composer is the one object on the
  // page, solid and lifted, with its rim colours pooled faintly beneath (.ai-underglow). Everything else is words:
  // Try asking and Recent chats as plain lists, side by side from md.
  if (!turns.length) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col">
        <div className="relative isolate">
          <div aria-hidden className="ai-underglow" />
          {composer}
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-12">
          <section aria-labelledby="try-h">
            <h2 id="try-h" className="mb-2 text-sm font-medium">
              Try asking
            </h2>
            <PromptSuggestions>
              {suggestions.map((s) => (
                <PromptSuggestion key={s} icon={suggestionIcon[s] ?? MessageSquare} onClick={() => ask(s)}>
                  {s}
                </PromptSuggestion>
              ))}
            </PromptSuggestions>
          </section>
          <section aria-labelledby="recent-h">
            <h2 id="recent-h" className="mb-2 text-sm font-medium">
              Recent chats
            </h2>
            <PromptSuggestions>
              {conversations.map((c) => (
                <PromptSuggestion key={c.id} icon={MessageSquare} meta={formatDate(c.at, { year: false })} onClick={() => ask(c.q)} className="[&_svg]:text-muted-foreground">
                  {c.title}
                </PromptSuggestion>
              ))}
            </PromptSuggestions>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-10">
        {turns.map((t) => (
          <div key={t.id} className="flex flex-col gap-5">
            <div className="flex items-start gap-3 self-end">
              <p className="max-w-[56ch] rounded-lg bg-foreground px-4 py-2.5 text-[15px] text-background">{t.q}</p>
              <PersonAvatar id={currentUser.id} className="size-7" decorative />
            </div>

            {!t.a ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
                <Spinner className="text-primary" /> Reading {contracts.length} contracts…
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
                <div className="min-w-0">
                  <div className="flex flex-col gap-3 text-base leading-[1.65] text-pretty">
                    {t.a.body.map((p, i) => (
                      <p key={i}>
                        <Cited text={p} active={cite?.turn === t.id ? cite.n : null} onCite={(n) => setCite({ turn: t.id, n })} />
                      </p>
                    ))}
                  </div>

                  {t.a.caveats?.length ? (
                    <Alert className="mt-5 bg-muted/60">
                      <Info />
                      <AlertTitle>What this answer can’t tell you</AlertTitle>
                      <AlertDescription>
                        <ul className="flex list-disc flex-col gap-1 pl-4">
                          {t.a.caveats.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {t.a.followUps?.length ? (
                    <section aria-label="Suggested follow-ups" className="mt-6">
                      <p className="mb-1 text-xs font-medium text-muted-foreground">Ask next</p>
                      <PromptSuggestions>
                        {t.a.followUps.map((f) => (
                          <PromptSuggestion key={f} icon={suggestionIcon[f]} onClick={() => ask(f)}>
                            {f}
                          </PromptSuggestion>
                        ))}
                      </PromptSuggestions>
                    </section>
                  ) : null}
                </div>

                <aside aria-label="Sources">
                  <p className="mb-2 text-xs text-muted-foreground">
                    {t.a.sources.length
                      ? `${t.a.sources.length} ${t.a.sources.length === 1 ? "source" : "sources"} · searched ${t.a.searched} contracts`
                      : `No sources · searched ${t.a.searched} contracts`}
                  </p>
                  <ol className="flex flex-col gap-2">
                    {t.a.sources.map((s, i) => {
                      const { contract, clause } = clauseOf(s.contractId, s.clauseId);
                      const on = cite?.turn === t.id && cite.n === i + 1;
                      return (
                        <li key={i}>
                          <Link
                            href={`/contracts/${contract.id}?clause=${encodeURIComponent(clause.id)}`}
                            onMouseEnter={() => setCite({ turn: t.id, n: i + 1 })}
                            className={cn(
                              "flex flex-col gap-1.5 rounded-xl bg-card px-3 py-3 ring-1 transition-[box-shadow]",
                              on ? "ring-2 ring-ring" : "ring-foreground/10 hover:ring-foreground/20",
                            )}
                          >
                              <span className="flex items-center gap-2 text-xs">
                                <Badge variant="secondary" className="tnum h-[18px] min-w-[18px] rounded px-1">
                                  {i + 1}
                                </Badge>
                                <span className="truncate font-medium">{contract.title}</span>
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Clause {clause.number} · {clause.heading}
                              </span>
                              <span className="line-clamp-3 font-document text-[13px] leading-relaxed text-foreground/80">“{clause.text}”</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </aside>
              </div>
            )}
          </div>
        ))}
      </div>
      <div ref={bottom} className="h-4" />
      <div className="sticky bottom-4 isolate mt-6">
        <div aria-hidden className="ai-underglow" />
        {composer}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Answers are drafted from your contracts. Check the clause before you act on one.</p>
    </div>
  );
}
