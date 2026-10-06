"use client";
// Throwaway: /proto/contracts shared parts. A copy of the contracts page's reading logic, the toolbar and the preview,
// so the variants can differ only in how they lay the work out. Nothing in production imports this folder.
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, Download, MessageSquare, Search, X } from "lucide-react";
import { toast } from "sonner";
import { people, workspace, type Contract, type ContractStatus, type Decision } from "@/lib/data";
import { daysUntil, formatDate, gbp } from "@/lib/dates";
import { decisionsFor, estateTotals, noticeBy } from "@/lib/derive";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader, PersonAvatar, StatusBadge } from "@/components/contravo/primitives";
import { UploadDialog } from "@/components/contravo/upload-dialog";
import { kindMeta } from "@/components/contravo/decision-list";

export type Group = "needs" | "soon" | "fine" | "setup" | "ended";

export type Row = Contract & {
  group: Group;
  next: string;
  nextDate: string | null;
  nextDays: number | null;
  decisions: Decision[];
  noticeBy: string;
};

export const groups: { key: Group; label: string; short: string; hint: string }[] = [
  { key: "needs", label: "Needs you", short: "Needs you", hint: "A decision is waiting, or the AI needs a person to check what it read." },
  { key: "soon", label: "Ending or renewing within 6 months", short: "Coming up", hint: "Nothing to do yet. These are the next to come up." },
  { key: "fine", label: "Running smoothly", short: "Running", hint: "Nothing due for at least six months." },
  { key: "setup", label: "Being set up", short: "Being set up", hint: "Drafts, uploads still being read, and contracts in review." },
  { key: "ended", label: "Finished", short: "Finished", hint: "Expired, terminated or archived. Kept for the record." },
];

const SIX_MONTHS = 183;
const SETUP: ContractStatus[] = ["Draft", "Awaiting upload", "Under review", "Legal review"];

function read(c: Contract): Pick<Row, "group" | "next" | "nextDate" | "nextDays"> {
  const ds = decisionsFor(c.id);
  const nb = noticeBy(c);
  const notice = daysUntil(nb);
  if (c.extraction === "Ready to review") return { group: "needs", next: "The AI has read it. Check what it found before it goes live.", nextDate: null, nextDays: null };
  if (ds.length && c.status === "Active") {
    const d = [...ds].sort((a, b) => a.due.localeCompare(b.due))[0];
    return { group: "needs", next: d.title, nextDate: d.due, nextDays: daysUntil(d.due) };
  }
  if (c.extraction === "Reading") return { group: "setup", next: "The AI is reading it. This usually takes a few minutes.", nextDate: null, nextDays: null };
  if (SETUP.includes(c.status)) return { group: "setup", next: `${c.status}. Due to start ${formatDate(c.start)}.`, nextDate: c.start, nextDays: daysUntil(c.start) };
  if (c.status !== "Active") return { group: "ended", next: `${c.status} ${formatDate(c.end)}.`, nextDate: null, nextDays: null };
  if (notice >= 0 && c.autoRenew)
    return {
      group: notice <= SIX_MONTHS ? "soon" : "fine",
      next: `Renews for ${c.autoRenew.months} months unless notice is given by ${formatDate(nb)}.`,
      nextDate: nb,
      nextDays: notice,
    };
  if (notice >= 0) return { group: notice <= SIX_MONTHS ? "soon" : "fine", next: `Ends ${formatDate(c.end)}. Decide what replaces it by ${formatDate(nb)}.`, nextDate: nb, nextDays: notice };
  const end = daysUntil(c.end);
  return { group: end <= SIX_MONTHS ? "soon" : "fine", next: `Ends ${formatDate(c.end)}. The notice date has passed.`, nextDate: c.end, nextDays: end };
}

/** Filters that cut across the sections. The ones that repeated a section ("Needs a decision", "Ending within 6 months") are gone. */
export const filters: { key: string; label: string; test: (r: Row) => boolean }[] = [
  { key: "mine", label: "Mine", test: (r) => r.owner === "priya" },
  { key: "renews", label: "Renews automatically", test: (r) => !!r.autoRenew && r.status === "Active" },
  { key: "big", label: "Over £1m a year", test: (r) => (r.annualValue ?? 0) >= 1_000_000 },
];

export const href = (r: Row) => (r.extraction === "Ready to review" ? `/contracts/${r.id}/review` : `/contracts/${r.id}`);
export const ownerName = (id: string | null) => (id ? people[id].name.replace(/^Dr /, "") : "No owner");

export function money(r: Contract, compact = true) {
  if (r.annualValue) return r.currency === "USD" ? `$${r.annualValue.toLocaleString("en-GB")} a year` : `${gbp(r.annualValue, { compact })} a year`;
  if (r.totalValue) return r.currency === "USD" ? `$${r.totalValue.toLocaleString("en-GB")} in total` : `${gbp(r.totalValue, { compact })} in total`;
  return "Value not recorded";
}

export const tone = (days: number | null) => (days === null ? "text-muted-foreground" : days <= 7 ? "text-critical" : days <= 31 ? "text-warning" : "text-muted-foreground");

export function when(days: number | null) {
  if (days === null) return "";
  if (days < 0) return `${-days} days ago`;
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days < 60) return `in ${days} days`;
  return `in ${Math.round(days / 30)} months`;
}

/** Rows, search, filters, preview and archive: everything the variants share */
export function useContracts() {
  const [q, setQ] = useState("");
  const [on, setOn] = useState<string[]>([]);
  const [peek, setPeek] = useState<Row | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [statusOverride, setStatusOverride] = useState<Record<string, ContractStatus>>({});

  const rows = useMemo<Row[]>(
    () =>
      workspace
        .map((c) => ({ ...c, status: statusOverride[c.id] ?? c.status }))
        .filter((c) => c.status !== "Deleted")
        .map((c) => ({ ...c, ...read(c), decisions: decisionsFor(c.id), noticeBy: noticeBy(c) }))
        .sort((a, b) => (a.nextDate ?? "9999").localeCompare(b.nextDate ?? "9999")),
    [statusOverride],
  );
  const narrowing = !!q || on.length > 0;
  const match = rows.filter(
    (r) =>
      on.every((k) => filters.find((f) => f.key === k)!.test(r)) &&
      (!q || `${r.title} ${r.supplier ?? ""} ${r.category} ${r.businessUnit ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  function open(r: Row, el: HTMLElement) {
    opener.current = el;
    setPeek(r);
  }
  function archive(r: Row) {
    const before = r.status;
    setStatusOverride((m) => ({ ...m, [r.id]: "Archived" }));
    setPeek(null);
    toast(`${r.title} archived`, { action: { label: "Undo", onClick: () => setStatusOverride((m) => ({ ...m, [r.id]: before })) }, duration: Infinity });
  }

  return { q, setQ, on, setOn, rows, match, narrowing, open, peek, setPeek, opener, archive };
}
export type Ctx = ReturnType<typeof useContracts>;

export function Header({ title = "Contracts", children }: { title?: string; children?: React.ReactNode }) {
  const t = estateTotals();
  return (
    <PageHeader
      title={title}
      actions={
        <>
          <Button variant="outline" onClick={() => toast.success("Exported contracts")}>
            <Download data-icon="inline-start" /> Export
          </Button>
          <UploadDialog />
        </>
      }
    >
      {children ?? (
        <>
          {t.live} live contracts worth about <span className="tnum text-foreground">{gbp(t.gbpAnnual, { compact: true })}</span> a year.
        </>
      )}
    </PageHeader>
  );
}

export function Toolbar({ ctx, className }: { ctx: Ctx; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 lg:flex-row lg:items-center", className)}>
      <label htmlFor="contract-search" className="sr-only">
        Search contracts
      </label>
      <InputGroup className="h-11 lg:max-w-md">
        <InputGroupAddon>
          <Search className="size-4.5" />
        </InputGroupAddon>
        <InputGroupInput id="contract-search" type="search" value={ctx.q} onChange={(e) => ctx.setQ(e.target.value)} placeholder="Search contracts, suppliers or departments" />
        {ctx.q && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => ctx.setQ("")}>
              <X />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
      <ToggleGroup type="multiple" variant="outline" value={ctx.on} onValueChange={ctx.setOn} aria-label="Filters" className="flex-wrap">
        {filters.map((f) => (
          <ToggleGroupItem key={f.key} value={f.key} className="gap-1.5 px-3">
            {f.label}
            <span className="tnum text-xs text-muted-foreground">{ctx.rows.filter(f.test).length}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="sr-only" role="status" aria-live="polite">
        {ctx.match.length} {ctx.match.length === 1 ? "contract" : "contracts"}
      </p>
    </div>
  );
}

export function NothingMatches({ q }: { q: string }) {
  return (
    <div className="rounded-xl bg-card px-5 py-14 text-center shadow-card">
      <p className="font-medium">Nothing matches</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Remove a filter, or{" "}
        <Link href={`/chat?q=${encodeURIComponent(q || "Which contracts need attention?")}`} className="font-medium text-primary underline underline-offset-4">
          ask the question instead
        </Link>
        .
      </p>
    </div>
  );
}

/** One contract as a row: name, what happens next, value, owner */
export function ContractRow({ r, ctx, showWhen = true, className }: { r: Row; ctx: Ctx; showWhen?: boolean; className?: string }) {
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={(e) => ctx.open(r, e.currentTarget)}
      className={cn(
        "group grid w-full gap-x-6 gap-y-1 px-5 py-3.5 text-left transition-colors duration-(--duration-fast) hover:bg-muted/60 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_9rem_8rem] md:items-center",
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block truncate font-medium group-hover:text-primary">{r.title}</span>
        <span className="block truncate text-sm text-muted-foreground">{r.supplier ?? "Supplier not recorded"}</span>
      </span>
      <span className="min-w-0 text-sm text-pretty">
        {r.next}
        {showWhen && r.nextDays !== null && <span className={cn("tnum ml-1.5 font-medium whitespace-nowrap", tone(r.nextDays))}>{when(r.nextDays)}</span>}
      </span>
      <span className="tnum text-sm text-muted-foreground md:text-right">{money(r)}</span>
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        <PersonAvatar id={r.owner} className="size-5" decorative />
        <span className="truncate">{ownerName(r.owner)}</span>
      </span>
    </button>
  );
}

/** Column labels for a list of rows, so the four columns read as a table */
export function ColumnHeads({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("hidden gap-x-6 px-5 py-2 text-xs text-muted-foreground md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_9rem_8rem]", className)}>
      <span>Contract</span>
      <span>What happens next</span>
      <span className="text-right">Value</span>
      <span>Owner</span>
    </div>
  );
}

export function PreviewSheet({ ctx }: { ctx: Ctx }) {
  const r = ctx.peek;
  return (
    <Sheet open={!!r} onOpenChange={(o) => !o && ctx.setPeek(null)}>
      <SheetContent
        className="w-full overflow-y-auto sm:max-w-md"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          if (ctx.opener.current?.isConnected) ctx.opener.current.focus();
        }}
      >
        {r && (
          <>
            <SheetHeader className="gap-2 border-b pb-5">
              <StatusBadge status={r.status} />
              <SheetTitle className="heading text-2xl font-normal">{r.title}</SheetTitle>
              <SheetDescription>{r.supplier ?? "Supplier not recorded"}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-4 pb-6">
              <div className="rounded-lg bg-highlight/70 px-4 py-3">
                <p className="text-xs font-medium tracking-[0.04em] text-foreground/70 uppercase">What happens next</p>
                <p className="mt-1 text-[15px] text-pretty">{r.next}</p>
              </div>
              <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-y-3 text-sm">
                {(
                  [
                    ["Value", money(r, false)],
                    ["Runs", `${formatDate(r.start)} to ${formatDate(r.end)}`],
                    ["Renews", r.autoRenew ? `Automatically, for ${r.autoRenew.months} months` : "No, it ends"],
                    ["Owner", ownerName(r.owner)],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="tnum">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col gap-2">
                <Button asChild size="lg">
                  <Link href={href(r)}>
                    {r.extraction === "Ready to review" ? "Check the details" : "Open contract"} <ArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href={`/chat?q=${encodeURIComponent(`Tell me about the ${r.title} contract`)}`}>
                    <MessageSquare data-icon="inline-start" /> Ask about this contract
                  </Link>
                </Button>
              </div>
              {r.status !== "Archived" && (
                <div className="border-t pt-4">
                  <Button variant="ghost" size="sm" onClick={() => ctx.archive(r)}>
                    <Archive data-icon="inline-start" /> Archive
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Every open task across the estate: one per decision, one per contract waiting for a check. Soonest first, undated last. */
export type Task = { id: string; r: Row; title: string; kind: string; due: string | null; days: number | null; action: string; to: string; impact?: Decision["impact"] };
export function tasksFrom(rows: Row[]): Task[] {
  const out: Task[] = [];
  for (const r of rows) {
    if (r.extraction === "Ready to review")
      out.push({ id: `chk-${r.id}`, r, title: `Check what the AI read in ${r.title}`, kind: "Details to check", due: null, days: null, action: "Check the details", to: href(r) });
    if (r.status === "Active")
      for (const d of r.decisions)
        out.push({ id: d.id, r, title: d.title, kind: kindMeta[d.kind].label, due: d.due, days: daysUntil(d.due), action: d.actions.primary, to: `/contracts/${r.id}#${d.id}`, impact: d.impact });
  }
  return out.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
}
