"use client";
// Throwaway: /proto/contract-page shared parts. A de-duplicated contract page: header, facts, decisions, activity.
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, FileSearch, ListChecks, MessageSquare, Pencil, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { audit, people, type Contract, type Decision } from "@/lib/data";
import { daysLeft, daysUntil, formatDate, gbp } from "@/lib/dates";
import { decisionsFor, nextDeadline, noticeBy } from "@/lib/derive";
import { cn } from "@/lib/utils";
import { kindMeta } from "@/components/contravo/decision-list";
import { BackLink, ExtractionBadge, PageHeader, Person, PersonAvatar, StatusBadge } from "@/components/contravo/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const jumpToClause = (id: string) => {
  const el = document.getElementById(`clause-${id}`);
  el?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  el?.focus({ preventScroll: true });
};
export const tone = (d: number) => (d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground");
export const money = (c: Contract, n: number | null) => (n == null ? null : c.currency === "USD" ? `$${n.toLocaleString("en-GB")}` : gbp(n));
export const openDecisions = (c: Contract) => decisionsFor(c.id).sort((a, b) => a.due.localeCompare(b.due));

/** Header with one way to check the AI's reading (an alert when it's waiting, not a button as well) */
export function Header({ c }: { c: Contract }) {
  return (
    <>
      <PageHeader
        title={c.title}
        leading={<BackLink href="/contracts" label="contracts" />}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/contracts/${c.id}/details`}>
                <Pencil data-icon="inline-start" /> Edit details
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/chat?q=${encodeURIComponent(`Can we end the ${c.title.toLowerCase()} contract early?`)}`}>
                <MessageSquare data-icon="inline-start" /> Ask about this contract
              </Link>
            </Button>
          </>
        }
      />
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <StatusBadge status={c.status} />
        <ExtractionBadge state={c.extraction} />
        <span className="text-foreground">{c.supplier ?? <span className="text-warning">No counterparty recorded</span>}</span>
        <span aria-hidden>·</span>
        <span>{c.category}</span>
        {c.businessUnit && (
          <>
            <span aria-hidden>·</span>
            <span>{c.businessUnit}</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>{c.route}</span>
        <Link href={`/contracts/${c.id}/review`} className="ml-auto inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline">
          <ListChecks className="size-3.5" aria-hidden /> Review extraction
        </Link>
      </div>
      {c.extraction === "Ready to review" && (
        <Alert className="mt-6">
          <FileSearch />
          <AlertTitle>The AI has read this contract. Check what it found before it goes live.</AlertTitle>
          <AlertDescription>
            <Link href={`/contracts/${c.id}/review`} className="font-medium text-primary underline underline-offset-4">
              Review what the AI read
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

/** Key facts as a quiet list. The next deadline appears here once; decisions don't repeat it as a hero. */
export function Facts({ c, showDeadline = true, className }: { c: Contract; showDeadline?: boolean; className?: string }) {
  const next = nextDeadline(c);
  const nb = noticeBy(c);
  const months = Math.round(c.notice / 30);
  const d = daysUntil(next.date);
  const rows: [string, React.ReactNode][] = [
    ...(showDeadline
      ? ([
          [
            next.label,
            <span key="d">
              <span className={cn("tnum font-medium", tone(d))}>{daysLeft(d)}</span>
              <span className="tnum text-muted-foreground"> · {formatDate(next.date)}</span>
              {c.autoRenew && daysUntil(nb) >= 0 && (
                <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <RefreshCw className="size-3" aria-hidden /> Renews for {c.autoRenew.months} months if no notice
                </span>
              )}
            </span>,
          ],
        ] as [string, React.ReactNode][])
      : []),
    ["Annual value", <span key="a" className={cn("tnum", !c.annualValue && "text-muted-foreground")}>{money(c, c.annualValue) ?? "Not held"}</span>],
    ["Total value", <span key="t" className={cn("tnum", !c.totalValue && "text-muted-foreground")}>{money(c, c.totalValue) ?? "Not held"}</span>],
    ["Term", <span key="te" className="tnum">{formatDate(c.start)} – {formatDate(c.end)}</span>],
    ["Notice", <span key="n" className="tnum">{months} {months === 1 ? "month" : "months"}{c.reviewDate && ` · review ${formatDate(c.reviewDate, { year: false })}`}</span>],
    ["Owner", <Person key="o" id={c.owner} />],
  ];
  return (
    <dl className={cn("divide-y divide-(--brand-line) text-sm", className)}>
      {rows.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 py-2.5">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A decision without the repeats: no contract name (you're on it), no owner if it's the contract owner, a jump to its clause */
export function DecisionCompact({ d, c, onHandled }: { d: Decision; c: Contract; onHandled: (d: Decision) => void }) {
  const k = kindMeta[d.kind];
  const days = daysUntil(d.due);
  return (
    <li id={d.id} className="scroll-mt-28 rounded-xl bg-card p-4 shadow-card">
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
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {d.impact && (
          <span>
            <span className="tnum font-medium text-foreground">{gbp(d.impact.amount)}</span> {d.impact.label}
          </span>
        )}
        {d.owner !== c.owner && (
          <span className="inline-flex items-center gap-1.5">
            <PersonAvatar id={d.owner} className="size-4" decorative /> {people[d.owner].name.replace(/^Dr /, "")}
          </span>
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm">
          {d.actions.primary} <ArrowRight data-icon="inline-end" />
        </Button>
        {d.clauseId && (
          <Button size="sm" variant="outline" onClick={() => jumpToClause(d.clauseId!)}>
            Show clause {d.clauseId} in the contract
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onHandled(d)}>
          Mark handled
        </Button>
      </div>
    </li>
  );
}

export function useHandled() {
  const [handled, setHandled] = useState<string[]>([]);
  const mark = (d: Decision) => {
    setHandled((h) => [...h, d.id]);
    toast("Marked as handled", { description: d.title, action: { label: "Undo", onClick: () => setHandled((h) => h.filter((x) => x !== d.id)) }, duration: Infinity });
  };
  return { handled, mark };
}

export function Activity({ c }: { c: Contract }) {
  const history = audit.filter((a) => a.href?.startsWith(`/contracts/${c.id}`)).slice(0, 4);
  if (!history.length) return <p className="text-sm text-muted-foreground">Nobody has opened this contract yet.</p>;
  return (
    <ol className="flex flex-col gap-3 text-sm">
      {history.map((h) => (
        <li key={h.at} className="flex gap-2.5">
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
  );
}

export function Flags({ c }: { c: Contract }) {
  if (!c.flags?.length) return null;
  return (
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
  );
}
