"use client";

/**
 * Ask Contravo drawer: slides out from the right edge of every page.
 * Decision record: docs/decisions/ask-entry-point.md
 */
import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, ArrowUpRight, ChevronRight, FileText, Info, Sparkles, X } from "lucide-react";
import { answer, suggestions as globalSuggestions, type Answer } from "@/lib/answers";
import { contracts, getContract, type Contract } from "@/lib/data";
import { decisionsFor } from "@/lib/derive";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";

type Turn = { id: number; q: string; a: Answer | null };

const contractSuggestions = [
  "Can we end this contract early?",
  "How do prices rise on this contract?",
  "When does it renew, and what happens if we miss the notice date?",
];

/** The contract the user is looking at, if any (/contracts/[id], not the review steps). */
function useCurrentContract(): Contract | undefined {
  const path = usePathname();
  const m = path.match(/^\/contracts\/([^/]+)$/);
  return m ? getContract(m[1]) : undefined;
}

export function AskDrawer() {
  const path = usePathname();
  const contract = useCurrentContract();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const tab = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const n = useRef(0);

  const hidden = path.startsWith("/chat"); // /chat is already the full conversation

  function ask(q: string) {
    const id = ++n.current;
    setTurns((t) => [...t, { id, q, a: null }]);
    setTimeout(() => setTurns((t) => t.map((x) => (x.id === id ? { ...x, a: answer(q) } : x))), 900);
  }

  function close() {
    setOpen(false);
    requestAnimationFrame(() => tab.current?.focus());
  }

  // ⌘J toggles; Escape closes
  useEffect(() => {
    if (hidden) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hidden]);

  // Focus the composer once the drawer has arrived
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => input.current?.focus({ preventScroll: true }), 260);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  if (hidden) return null;

  const suggestions = contract ? contractSuggestions : globalSuggestions.slice(0, 3);
  const open_decisions = contract ? decisionsFor(contract.id).length : 0;

  return (
    <div
      data-open={open || undefined}
      className={cn(
        "fixed top-14 right-0 bottom-0 z-(--z-overlay) w-[min(420px,calc(100vw-2.75rem))]",
        "translate-x-full transition-transform duration-180 ease-in",
        "data-open:translate-x-0 data-open:duration-250 data-open:ease-(--ease-out)",
      )}
    >
      {/* The tab rides on the drawer's leading edge */}
      <button
        ref={tab}
        aria-expanded={open}
        aria-controls="ask-drawer"
        aria-label={open ? "Close Ask Contravo" : "Open Ask Contravo"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "absolute top-1/2 right-full flex w-10 -translate-y-1/2 flex-col items-center gap-2.5 rounded-l-xl bg-primary py-4 text-primary-foreground",
          "shadow-[-4px_0_16px_rgb(3_1_57/0.12),0_1px_2px_rgb(3_1_57/0.2)] transition-[background-color,translate] duration-(--duration-fast) ease-(--ease-out)",
          "hover:-translate-x-0.5 hover:bg-(--primary-hover)",
        )}
      >
        {open ? <ChevronRight className="size-4" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
        <span className="rotate-180 text-[13px] font-medium tracking-[0.01em] [writing-mode:vertical-rl]" aria-hidden>
          Ask Contravo
        </span>
        <Kbd className="h-auto min-w-0 rotate-180 border-0 bg-white/15 px-1 py-1 text-[10px] text-primary-foreground [writing-mode:vertical-rl]" aria-hidden>
          ⌘J
        </Kbd>
      </button>

      <aside
        id="ask-drawer"
        aria-label="Ask Contravo"
        inert={!open}
        className={cn(
          "flex h-full flex-col border-l bg-background transition-shadow duration-250",
          open && "shadow-[-8px_0_24px_rgb(3_1_57/0.08),-24px_0_64px_rgb(3_1_57/0.08)]",
        )}
      >
        <header className="flex items-center gap-2 border-b px-4 py-3">
          <Sparkles className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium">{contract ? "Ask about this contract" : "Ask Contravo"}</h2>
            <p className="truncate text-xs text-muted-foreground">
              {contract ? `${contract.title} · ${contract.pages.held} pages read` : `Searches all ${contracts.length} contracts`}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/chat" aria-label="Open in Chat">
              <ArrowUpRight />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={close}>
            <X />
          </Button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {turns.length === 0 ? (
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-muted/70 p-4">
                {contract && open_decisions > 0 ? (
                  <p className="text-sm font-medium">
                    {open_decisions === 1 ? "One thing" : `${open_decisions} things`} on this contract need a decision
                  </p>
                ) : (
                  <p className="text-sm font-medium">Ask in plain English</p>
                )}
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Answers come from the contract text, with the clause each one is based on. Click a citation to open the clause.
                </p>
              </div>
              <ul className="flex flex-col gap-1.5" aria-label="Suggested questions">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => ask(s)}
                      className="w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:border-ring hover:bg-accent/40"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {turns.map((t) => (
                <div key={t.id} className="flex flex-col gap-3">
                  <p className="text-sm font-medium">{t.q}</p>
                  <AnswerBody turn={t} />
                </div>
              ))}
              <div ref={end} />
            </div>
          )}
        </div>

        <footer className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = draft.trim();
              if (q) {
                ask(q);
                setDraft("");
              }
            }}
          >
            <InputGroup className="h-auto items-end">
              <InputGroupTextarea
                ref={input}
                rows={1}
                aria-label="Ask a question"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder={contract ? "Ask about this contract…" : "Ask about any contract…"}
                className="max-h-32 min-h-9 py-2 text-base md:text-sm"
              />
              <InputGroupAddon align="inline-end" className="pb-1.5">
                <InputGroupButton type="submit" variant="default" size="icon-xs" aria-label="Send" disabled={!draft.trim()}>
                  <ArrowUp />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
          <p className="mt-2 text-[11px] text-muted-foreground">Drafted from your contracts. Check the clause before you act.</p>
        </footer>
      </aside>
    </div>
  );
}

function AnswerBody({ turn }: { turn: Turn }) {
  if (!turn.a) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Spinner className="text-primary" /> Reading {contracts.length} contracts…
      </p>
    );
  }
  const a = turn.a;
  const href = (i: number) => {
    const s = a.sources[i];
    return s ? `/contracts/${s.contractId}?clause=${encodeURIComponent(s.clauseId)}` : undefined;
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 text-sm leading-relaxed text-pretty">
        {a.body.map((p, i) => (
          <p key={i}>
            {p.split(/(\[\d+\])/g).map((part, j) => {
              const m = part.match(/^\[(\d+)\]$/);
              if (!m) return <Fragment key={j}>{part}</Fragment>;
              const h = href(Number(m[1]) - 1);
              return h ? (
                <Link
                  key={j}
                  href={h}
                  scroll={false}
                  aria-label={`Source ${m[1]}`}
                  className="tnum mx-0.5 inline-grid h-[18px] min-w-[18px] -translate-y-px place-items-center rounded bg-secondary px-1 align-middle text-[11px] font-medium text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                >
                  {m[1]}
                </Link>
              ) : (
                <Fragment key={j}>{part}</Fragment>
              );
            })}
          </p>
        ))}
      </div>
      {a.sources.length > 0 && (
        <ol className="flex flex-col gap-1.5" aria-label="Sources">
          {a.sources.map((s, i) => {
            const c = getContract(s.contractId)!;
            const k = c.clauses.find((x) => x.id === s.clauseId)!;
            return (
              <li key={i}>
                <Link
                  href={href(i)!}
                  scroll={false}
                  className="flex items-start gap-2 rounded-lg border bg-card px-2.5 py-2 text-xs transition-colors hover:border-ring"
                >
                  <span className="tnum mt-px grid size-[18px] shrink-0 place-items-center rounded bg-secondary text-[11px] font-medium text-secondary-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      Clause {k.number} · {k.heading}
                    </span>
                    <span className="block truncate text-muted-foreground">{c.title}</span>
                  </span>
                  <FileText className="ml-auto size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ol>
      )}
      {a.caveats?.length ? (
        <div className="rounded-lg bg-muted/70 px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
            <Info className="size-3.5" aria-hidden /> What this can’t tell you
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-4">
            {a.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
