"use client";

/**
 * The contract page's left panel: a Frost panel with three tabs, Needs you, Details and Activity, each made of small
 * white cards. Sits beside the contract (ContractReader) from xl, sticky, scrolling on its own if it's taller than
 * the screen; the panel's padding keeps card edges and shadows from being clipped.
 * Decision record: docs/decisions/contract-page.md
 */
import { useEffect, useState } from "react";
import { ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { audit, getContract, people, type Decision } from "@/lib/data";
import { daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { decisionsFor, nextDeadline, noticeBy } from "@/lib/derive";
import { cn } from "@/lib/utils";
import { kindMeta } from "./decision-list";
import { Person, PersonAvatar } from "./primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const tone = (d: number) => (d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground");
const cardCls = "rounded-lg bg-card shadow-card";

function jumpToClause(id: string) {
  const el = document.getElementById(`clause-${id}`);
  el?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el?.focus({ preventScroll: true });
}

export function ContractPanel({ contractId, live }: { contractId: string; live: boolean }) {
  const c = getContract(contractId)!;
  const [handled, setHandled] = useState<string[]>([]);
  const open = decisionsFor(c.id)
    .filter((d) => !handled.includes(d.id))
    .sort((a, b) => a.due.localeCompare(b.due));
  const history = audit.filter((a) => a.href?.startsWith(`/contracts/${c.id}`)).slice(0, 4);
  const [tab, setTab] = useState(open.length ? "needs" : "details");

  // A clause's "Needs a decision" link (#d-…) opens this tab and brings the card into view
  useEffect(() => {
    function onHash() {
      const id = decodeURIComponent(location.hash.slice(1));
      if (!id.startsWith("d-")) return;
      setTab("needs");
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "nearest" }));
    }
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  function markHandled(d: Decision) {
    setHandled((h) => [...h, d.id]);
    toast("Marked as handled", {
      description: d.title,
      action: { label: "Undo", onClick: () => setHandled((h) => h.filter((x) => x !== d.id)) },
      duration: Infinity, // WCAG 2.2.1: no time limit on Undo
    });
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-0 rounded-xl bg-muted p-3">
      <TabsList variant="line" className="w-full justify-start px-1">
        <TabsTrigger value="needs">
          Needs you <span className="tnum ml-1 text-muted-foreground">{open.length}</span>
        </TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="needs" tabIndex={-1} className="mt-3">
        {open.length ? (
          <ol className="flex flex-col gap-2.5">
            {open.map((d) => (
              <DecisionCard key={d.id} d={d} ownerOfContract={c.owner} onHandled={markHandled} />
            ))}
          </ol>
        ) : (
          <p className={cn(cardCls, "p-4 text-sm text-muted-foreground")}>Nothing needs a decision on this contract.</p>
        )}
      </TabsContent>

      <TabsContent value="details" tabIndex={-1} className="mt-3 flex flex-col gap-2.5">
        <Facts c={c} live={live} />
        {c.flags?.length ? (
          <Alert className="border-warning/30 bg-warning-muted text-warning">
            <AlertTitle>Check before you rely on these figures</AlertTitle>
            <AlertDescription className="text-foreground/80">
              <ul className="list-disc pl-4">
                {c.flags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}
      </TabsContent>

      <TabsContent value="activity" tabIndex={-1} className="mt-3">
        {history.length ? (
          <ol className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.at} className={cn(cardCls, "flex gap-2.5 p-3 text-sm")}>
                <PersonAvatar id={h.who} className="mt-0.5 size-5" decorative />
                <span className="min-w-0">
                  <span className="font-medium">{people[h.who]?.name ?? "Contravo"}</span> <span className="text-muted-foreground">{h.what}</span> {h.target}
                  <span className="tnum block text-xs text-muted-foreground">
                    {new Date(h.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className={cn(cardCls, "p-4 text-sm text-muted-foreground")}>Nobody has opened this contract yet.</p>
        )}
      </TabsContent>
    </Tabs>
  );
}

/** A decision without the repeats: no contract name (you're on it), no owner when it's the contract owner, a jump to its clause */
function DecisionCard({ d, ownerOfContract, onHandled }: { d: Decision; ownerOfContract: string | null; onHandled: (d: Decision) => void }) {
  const k = kindMeta[d.kind];
  const days = daysUntil(d.due);
  return (
    <li id={d.id} className={cn(cardCls, "scroll-mt-28 p-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <k.icon className="size-3.5 text-primary" aria-hidden /> {k.label}
        </span>
        <span className={cn("tnum font-medium", tone(days))}>
          {daysLeft(days)} · {formatDate(d.due, { year: false })}
        </span>
      </div>
      <h3 className="mt-1.5 font-medium text-pretty">{d.title}</h3>
      <p className="mt-1 text-sm text-pretty text-muted-foreground">{d.detail}</p>
      {(d.impact || d.owner !== ownerOfContract) && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {d.impact && (
            <span>
              <span className="tnum font-medium text-foreground">{gbp(d.impact.amount)}</span> {d.impact.label}
            </span>
          )}
          {d.owner !== ownerOfContract && (
            <span className="inline-flex items-center gap-1.5">
              <PersonAvatar id={d.owner} className="size-4" decorative /> {people[d.owner].name.replace(/^Dr /, "")}
            </span>
          )}
        </p>
      )}
      <div className="mt-3 flex flex-col gap-1.5">
        <Button size="sm" className="self-start">
          {d.actions.primary} <ArrowRight data-icon="inline-end" />
        </Button>
        <div className="-ml-2.5 flex flex-wrap gap-x-1">
          {d.clauseId && (
            <Button size="sm" variant="ghost" onClick={() => jumpToClause(d.clauseId!)}>
              Show clause {d.clauseId}
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onHandled(d)}>
            Mark handled
          </Button>
        </div>
      </div>
    </li>
  );
}

/** Key facts in one small card. The next date shows here once; decisions carry their own date line. */
function Facts({ c, live }: { c: NonNullable<ReturnType<typeof getContract>>; live: boolean }) {
  const next = nextDeadline(c);
  const nb = noticeBy(c);
  const months = Math.round(c.notice / 30);
  const money = (n: number | null) => (n == null ? null : c.currency === "USD" ? `$${n.toLocaleString("en-GB")}` : gbp(n));
  const d = daysUntil(next.date);
  const rows: [string, React.ReactNode][] = [
    [
      live ? next.label : "Next date",
      live ? (
        <span>
          <span className={cn("tnum font-medium", tone(d))}>{daysLeft(d)}</span>
          <span className="tnum text-muted-foreground"> · {formatDate(next.date)}</span>
          {c.autoRenew && daysUntil(nb) >= 0 && (
            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="size-3" aria-hidden /> Renews for {c.autoRenew.months} months if no notice
            </span>
          )}
        </span>
      ) : (
        <span className="text-muted-foreground">Not set until the details are checked</span>
      ),
    ],
    ["Annual value", <span key="a" className={cn("tnum", !c.annualValue && "text-muted-foreground")}>{money(c.annualValue) ?? "Not held"}</span>],
    ["Total value", <span key="t" className={cn("tnum", !c.totalValue && "text-muted-foreground")}>{money(c.totalValue) ?? "Not held"}</span>],
    ["Term", <span key="te" className="tnum">{formatDate(c.start)} – {formatDate(c.end)}</span>],
    ["Notice", <span key="n" className="tnum">{months} {months === 1 ? "month" : "months"}{c.reviewDate && ` · review ${formatDate(c.reviewDate, { year: false })}`}</span>],
    ["Owner", <Person key="o" id={c.owner} />],
  ];
  return (
    <dl className={cn(cardCls, "divide-y divide-(--brand-line) px-4 text-sm")}>
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
