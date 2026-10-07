"use client";
// Throwaway: /proto/chat round 2. Focus is live but busy: a glowing composer above five glowing suggestion cards.
// Two calmer directions, both keeping the composer as the one AI moment and giving it a real shadow above the glow.
// Asking opens the real thread (/chat?q=). Nothing in production imports this folder.
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpLeft, CalendarX2, Copy, MessageSquare, RefreshCw, Thermometer, TrendingUp, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { suggestions } from "@/lib/answers";
import { conversations, currentUser } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PromptComposer } from "@/components/ui/prompt-composer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const intro = "Answers come from the documents in your workspace, not from general knowledge. Every answer shows the passages it came from and says what it couldn’t check.";

const icon: Record<string, LucideIcon> = {
  "Which contracts let us end early without a penalty?": CalendarX2,
  "Who pays if the vaccine fridge fails?": Thermometer,
  "Which contracts renew automatically?": RefreshCw,
  "How do prices rise across our contracts?": TrendingUp,
  "Are we paying for anything twice?": Copy,
};

/* Short chip labels for the Chips variant: the full question goes into the composer */
const short: Record<string, string> = {
  "Which contracts let us end early without a penalty?": "End early without a penalty",
  "Who pays if the vaccine fridge fails?": "Who pays if the fridge fails",
  "Which contracts renew automatically?": "Automatic renewals",
  "How do prices rise across our contracts?": "How prices rise",
  "Are we paying for anything twice?": "Paying twice",
};

/* The shadow on top of the glow: a hairline ring, a tight contact shadow and a soft lift, so the composer sits above
   its colour instead of dissolving into it */
const lifted =
  "[--composer-shadow:0_0_0_1px_rgb(3_1_57/0.06),0_1px_2px_rgb(3_1_57/0.06),0_10px_28px_-10px_rgb(3_1_57/0.18)]";

function Greeting() {
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-col items-center pt-6 text-center sm:pt-12">
      <h1 className="page-title text-balance">What do you need to know, {currentUser.name.split(" ")[0]}?</h1>
      <p className="mt-3 max-w-[56ch] text-pretty text-muted-foreground">{intro}</p>
      <Tabs defaultValue="ask" className="mt-6">
        <TabsList>
          <TabsTrigger value="ask">Ask a question</TabsTrigger>
          <TabsTrigger value="foi" onClick={() => toast("FOI tab: unchanged in these concepts")}>
            FOI request
          </TabsTrigger>
        </TabsList>
        {/* Empty panels so each tab controls a real element; the page content below is the Ask panel's stand-in */}
        <TabsContent value="ask" />
        <TabsContent value="foi" />
      </Tabs>
    </header>
  );
}

function useComposer() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const ask = (q: string) => q.trim() && router.push(`/chat?q=${encodeURIComponent(q.trim())}`);
  const composer = (
    <PromptComposer
      ref={ref}
      aria-label="Ask about your contracts"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder="Ask about your contracts: dates, obligations, parties, values."
      rows={4}
      onSend={() => ask(draft)}
      onAttach={() => toast("Attach a file (concept only)")}
    />
  );
  return { ask, composer, setDraft, ref };
}

function Recent({ ask, className }: { ask: (q: string) => void; className?: string }) {
  return (
    <section aria-labelledby="recent-h" className={className}>
      <h2 id="recent-h" className="mb-2 text-sm font-medium">
        Recent chats
      </h2>
      <ul className="divide-y divide-(--brand-line)">
        {conversations.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => ask(c.q)}
              className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm transition-colors duration-(--duration-fast) hover:bg-muted"
            >
              <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="min-w-0 flex-1 truncate group-hover:text-primary">{c.title}</span>
              <span className="tnum shrink-0 text-xs text-muted-foreground">{formatDate(c.at, { year: false })}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * 1. Quiet list. The composer is the only object on the page: solid white, lifted by a shadow, its glow pooled
 * tighter and softer underneath. Suggestions lose their cards, rims and icon tiles and become a plain list beside
 * Recent chats, so the eye goes composer, then words.
 */
export function QuietList() {
  const { ask, composer } = useComposer();
  return (
    <div>
      <Greeting />
      <div className="mx-auto mt-6 flex max-w-3xl flex-col">
        <div className={cn("relative isolate", lifted)}>
          <div aria-hidden className="ai-underglow [--ai-underglow-blur:24px] [--ai-underglow-inset:3rem_3.5rem_-0.75rem] [--ai-underglow-opacity:0.35]" />
          {composer}
        </div>

        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-12">
          <section aria-labelledby="try-h">
            <h2 id="try-h" className="mb-2 text-sm font-medium">
              Try asking
            </h2>
            <ul className="divide-y divide-(--brand-line)">
              {suggestions.map((s) => {
                const I = icon[s] ?? MessageSquare;
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => ask(s)}
                      className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm transition-colors duration-(--duration-fast) hover:bg-muted"
                    >
                      <I className="size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0 flex-1 text-pretty group-hover:text-primary">{s}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <Recent ask={ask} />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Chips. No pooled glow at all: the colour lives only in the composer's 1px rim, and the composer sits on the page
 * with a plain lifted shadow. Suggestions are short white chips tucked under it. A chip fills the composer rather
 * than sending, so you can edit the question first; the cursor lands at the end.
 */
export function Chips() {
  const { ask, composer, setDraft, ref } = useComposer();
  return (
    <div>
      <Greeting />
      <div className="mx-auto mt-6 flex max-w-3xl flex-col">
        <div className={lifted}>{composer}</div>

        <section aria-labelledby="chips-h" className="mt-4">
          <h2 id="chips-h" className="sr-only">
            Suggested questions (fills the box so you can edit before sending)
          </h2>
          <ul className="flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const I = icon[s] ?? MessageSquare;
              return (
                <li key={s}>
                  <Button
                    variant="outline"
                    size="sm"
                    title={s}
                    aria-label={`Use: ${s}`}
                    className="font-normal text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setDraft(s);
                      requestAnimationFrame(() => {
                        const t = ref.current;
                        if (!t) return;
                        t.focus();
                        t.setSelectionRange(s.length, s.length);
                      });
                    }}
                  >
                    <I data-icon="inline-start" className="text-primary" aria-hidden />
                    {short[s] ?? s}
                    <ArrowUpLeft data-icon="inline-end" className="opacity-60" aria-hidden />
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>

        <Recent ask={ask} className="mt-14" />
      </div>
    </div>
  );
}
