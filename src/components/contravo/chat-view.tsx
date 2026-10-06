"use client";

/**
 * The chat page ("Focus"): a centred greeting, the Ask / FOI switch, then the work. The greeting steps aside once a
 * conversation starts, so the thread gets the room; the heading stays for screen readers.
 * Decision record: docs/decisions/ask-composer.md
 */
import { Suspense, useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AskThread } from "./ask-thread";
import { FoiIntake } from "./foi-intake";

const copy = {
  ask: {
    intro: "Answers come from the documents in your workspace, not from general knowledge. Every answer shows the passages it came from and says what it couldn’t check.",
  },
  foi: {
    title: "Answer an FOI request",
    intro: "Paste the request and Contravo drafts a response from your contracts, with the 20 working day deadline worked out for you.",
  },
};

export function ChatView({ initialTab, firstName }: { initialTab: "ask" | "foi"; firstName: string }) {
  const [tab, setTab] = useState(initialTab);
  const [inThread, setInThread] = useState(false);
  const quiet = tab === "ask" && inThread;

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "ask" | "foi")} className="gap-0">
      <header className={cn("mx-auto flex w-full max-w-3xl flex-col items-center text-center", quiet ? "pt-0" : "pt-6 sm:pt-12")}>
        <h1 className={cn("page-title text-balance", quiet && "sr-only")}>{tab === "foi" ? copy.foi.title : quiet ? "Ask about your contracts" : `What do you need to know, ${firstName}?`}</h1>
        {!quiet && <p className="mt-3 max-w-[56ch] text-pretty text-muted-foreground">{tab === "foi" ? copy.foi.intro : copy.ask.intro}</p>}
        <TabsList className={quiet ? "" : "mt-6"}>
          <TabsTrigger value="ask">Ask a question</TabsTrigger>
          <TabsTrigger value="foi">FOI request</TabsTrigger>
        </TabsList>
      </header>
      <TabsContent value="ask" tabIndex={-1} className="mt-6">
        <Suspense>
          <AskThread onThreadChange={setInThread} />
        </Suspense>
      </TabsContent>
      <TabsContent value="foi" tabIndex={-1} className="mx-auto mt-8 w-full max-w-3xl">
        <FoiIntake />
      </TabsContent>
    </Tabs>
  );
}
