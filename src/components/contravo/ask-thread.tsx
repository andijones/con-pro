"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Info, MessageSquare } from "lucide-react";
import { answer, suggestions, type Answer } from "@/lib/answers";
import { contracts, conversations, currentUser } from "@/lib/data";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { PersonAvatar } from "./primitives";

type Turn = { id: number; q: string; a: Answer | null };
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

export function AskThread() {
  const params = useSearchParams();
  const router = useRouter();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [scope, setScope] = useState("all");
  const [attachments, setAttachments] = useState(true);
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

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.trim()) {
          ask(draft.trim());
          setDraft("");
        }
      }}
    >
      <InputGroup className="bg-card shadow-sm">
        <InputGroupTextarea
          aria-label="Ask about your contracts"
          value={draft}
          maxLength={MAX}
          rows={turns.length ? 1 : 3}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          placeholder={turns.length ? "Ask a follow-up" : "Ask about your contracts: dates, obligations, parties, values."}
          className="text-base md:text-sm"
        />
        <InputGroupAddon align="block-end" className="flex-wrap gap-x-3">
          <InputGroupText className="hidden text-xs sm:inline">Enter to send. Shift + Enter for a new line.</InputGroupText>
          <div className="ml-auto flex items-center gap-3">
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger size="sm" className="h-7 border-0 bg-transparent text-xs shadow-none" aria-label="Which contracts">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="all">All contracts</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="estates">Estates & Facilities</SelectItem>
              </SelectContent>
            </Select>
            <Label className="gap-1.5 text-xs font-normal text-muted-foreground">
              <Checkbox checked={attachments} onCheckedChange={(v) => setAttachments(!!v)} /> Include attachments
            </Label>
            <InputGroupText className="tnum text-xs">
              {draft.length} / {MAX}
            </InputGroupText>
            <InputGroupButton type="submit" variant="default" size="sm" disabled={!draft.trim()}>
              <ArrowUp /> Send
            </InputGroupButton>
          </div>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );

  if (!turns.length) {
    return (
      <div className="flex flex-col gap-8">
        {composer}
        <section>
          <h2 className="mb-3 text-sm font-medium">Try asking</h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button key={s} variant="outline" size="sm" className="h-auto py-1.5 font-normal whitespace-normal" onClick={() => ask(s)}>
                {s}
              </Button>
            ))}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-sm font-medium">Previous conversations</h2>
          <ItemGroup className="gap-2">
            {conversations.map((c) => (
              <Item key={c.id} variant="outline" asChild>
                <button onClick={() => ask(c.q)} className="text-left">
                  <ItemMedia variant="icon">
                    <MessageSquare />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{c.title}</ItemTitle>
                    <ItemDescription>{formatDate(c.at)}</ItemDescription>
                  </ItemContent>
                </button>
              </Item>
            ))}
          </ItemGroup>
        </section>
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
                    <div className="mt-5 flex flex-wrap gap-2">
                      {t.a.followUps.map((f) => (
                        <Button key={f} variant="outline" size="sm" className="rounded-full font-normal" onClick={() => ask(f)}>
                          {f}
                        </Button>
                      ))}
                    </div>
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
      <div className="sticky bottom-4 mt-6">{composer}</div>
      <p className="mt-2 text-center text-xs text-muted-foreground">Answers are drafted from your contracts. Check the clause before you act on one.</p>
    </div>
  );
}
