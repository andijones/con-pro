"use client";
// Throwaway: /proto/chat. The two directions not taken (Focus went live). Three ways originally to give the glow something to glow against. Asking opens the real thread (/chat?q=).
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { suggestions } from "@/lib/answers";
import { conversations, currentUser } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { PageHeader } from "@/components/contravo/primitives";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { PromptComposer } from "@/components/ui/prompt-composer";
import { PromptSuggestion, PromptSuggestions } from "@/components/ui/prompt-suggestion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const intro = "Answers come from the documents in your workspace, not from general knowledge. Every answer shows the passages it came from and says what it couldn’t check.";

function useAsk() {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const ask = (q: string) => q.trim() && router.push(`/chat?q=${encodeURIComponent(q.trim())}`);
  const composer = (
    <PromptComposer
      aria-label="Ask about your contracts"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      placeholder="Ask about your contracts: dates, obligations, parties, values."
      blobTranslucent
      rows={4}
      onSend={() => ask(draft)}
      onAttach={() => toast("Attach a file (concept only)")}
    />
  );
  return { ask, composer };
}

function ModeTabs({ className }: { className?: string }) {
  return (
    <Tabs defaultValue="ask" className={className}>
      <TabsList>
        <TabsTrigger value="ask">Ask a question</TabsTrigger>
        <TabsTrigger value="foi" asChild>
          <Link href="/chat?tab=foi">FOI request</Link>
        </TabsTrigger>
      </TabsList>
      {/* The Ask panel is the content below; FOI opens the real page. Empty panels keep the tabs' aria-controls valid. */}
      <TabsContent value="ask" className="hidden" />
      <TabsContent value="foi" className="hidden" />
    </Tabs>
  );
}

function Previous({ ask }: { ask: (q: string) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-medium">Previous conversations</h2>
      <ItemGroup className="gap-2">
        {conversations.map((c) => (
          <div key={c.id} role="listitem">
            <Item variant="outline" asChild>
              <button type="button" onClick={() => ask(c.q)} className="text-left">
                <ItemMedia variant="icon" className="text-muted-foreground">
                  <MessageSquare />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{c.title}</ItemTitle>
                  <ItemDescription className="tnum">{formatDate(c.at)}</ItemDescription>
                </ItemContent>
              </button>
            </Item>
          </div>
        ))}
      </ItemGroup>
    </section>
  );
}

/* ---------- 1. Aurora stage: the composer and suggestions sit on a soft brand-colour field, so the frost is glass over colour ---------- */

export function Aurora() {
  const { ask, composer } = useAsk();
  return (
    <div>
      <PageHeader title="Ask about your contracts">{intro}</PageHeader>
      <ModeTabs className="mt-6" />
      <div className="proto-aurora relative isolate mt-4 overflow-hidden rounded-2xl px-5 py-8 sm:px-10 sm:py-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          {composer}
          <section>
            <h2 className="mb-3 text-sm font-medium">Try asking</h2>
            <PromptSuggestions aria-label="Suggested questions">
              {suggestions.map((s) => (
                <PromptSuggestion key={s} onClick={() => ask(s)}>
                  {s}
                </PromptSuggestion>
              ))}
            </PromptSuggestions>
          </section>
        </div>
      </div>
      <div className="mt-10">
        <Previous ask={ask} />
      </div>
      <style>{`
        /* Slate-50 base with three soft brand pools: Iris top left, Mint right, Lilac low. Text on it stays Midnight
           on (at most) a pale tint, well above 4.5:1. The pools are decoration, so they're a background, not elements. */
        .proto-aurora {
          background:
            radial-gradient(ellipse 55% 60% at 12% 8%, color-mix(in oklab, var(--brand-iris) 45%, transparent), transparent 72%),
            radial-gradient(ellipse 45% 55% at 92% 30%, color-mix(in oklab, var(--halo-mint) 65%, transparent), transparent 72%),
            radial-gradient(ellipse 60% 50% at 45% 105%, color-mix(in oklab, var(--brand-lilac-deep) 80%, transparent), transparent 72%),
            var(--neutral-50);
          box-shadow: var(--elevation-0);
        }
        .proto-aurora { --suggestion-rim-rest: 0.8; }
      `}</style>
    </div>
  );
}

/* ---------- 2. Midnight: a brand-dark panel for the moment of asking; the glow does what glows do on dark ---------- */

export function Midnight() {
  const { ask, composer } = useAsk();
  return (
    <div>
      <PageHeader title="Ask about your contracts" />
      <ModeTabs className="mt-6" />
      <div className="proto-night relative isolate mt-4 overflow-hidden rounded-2xl px-5 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto flex max-w-3xl flex-col gap-8">
          <div>
            <h2 className="text-2xl tracking-[-0.02em] text-white">What do you need to know, {currentUser.name.split(" ")[0]}?</h2>
            <p className="mt-2 max-w-[60ch] text-pretty text-white/75">{intro}</p>
          </div>
          {composer}
          <section>
            <h2 className="mb-3 text-sm font-medium text-white">Try asking</h2>
            <PromptSuggestions aria-label="Suggested questions">
              {suggestions.map((s) => (
                <PromptSuggestion key={s} onClick={() => ask(s)}>
                  {s}
                </PromptSuggestion>
              ))}
            </PromptSuggestions>
          </section>
        </div>
      </div>
      <div className="mt-10">
        <Previous ask={ask} />
      </div>
      <style>{`
        /* Midnight with Iris and Mint light pooling into it. Not a dark theme: one brand panel on a light page.
           White text on Midnight is 19.7:1; white at 75% is still above 11:1. */
        .proto-night {
          background:
            radial-gradient(ellipse 60% 70% at 10% 0%, color-mix(in oklab, var(--brand-violet) 75%, transparent), transparent 70%),
            radial-gradient(ellipse 50% 60% at 95% 25%, color-mix(in oklab, var(--brand-iris) 45%, transparent), transparent 70%),
            radial-gradient(ellipse 55% 45% at 50% 110%, color-mix(in oklab, var(--halo-mint) 30%, transparent), transparent 70%),
            var(--brand-midnight);
          --focus: #ffffff; /* keyboard focus outline: white on the dark panel */
          /* Suggestions become dark glass with white labels; the rim glows at full strength */
          --suggestion-surface: linear-gradient(to bottom, rgb(28 20 98 / 0.9), rgb(12 8 70 / 0.92)); /* deep glass: the colour stays on the 1px rim, white labels keep 14:1+ */
          --suggestion-surface-hover: linear-gradient(to bottom, rgb(44 32 130 / 0.9), rgb(22 14 90 / 0.92));
          --suggestion-shadow: none;
          --suggestion-shadow-hover: 0 8px 24px -8px rgb(137 117 239 / 0.5);
          --suggestion-rim-rest: 0.95;
          --brand-line: rgb(255 255 255 / 0.2);
          /* The composer goes near-solid white so its muted text keeps contrast over the dark */
          --composer-frost: linear-gradient(to bottom, rgb(255 255 255 / 0.97), rgb(255 255 255 / 0.94));
          --composer-shadow: 0 10px 40px -10px rgb(137 117 239 / 0.55);
        }
        .proto-night .prompt-suggestion-surface { color: #fff; }
      `}</style>
    </div>
  );
}
