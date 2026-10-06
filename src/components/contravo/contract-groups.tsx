"use client";

/**
 * Contracts: one tab per group (what each contract needs), Needs you first, with search, filters and a preview.
 * Every row carries a "when" badge, so the date is never just coloured text.
 * Decision record: docs/decisions/contracts.md
 */
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, Download, MessageSquare, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { people, workspace, type Contract, type ContractStatus } from "@/lib/data";
import { daysUntil, formatDate, gbp } from "@/lib/dates";
import { decisionsFor, noticeBy } from "@/lib/derive";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader, PersonAvatar, StatusBadge } from "./primitives";
import { UploadDialog } from "./upload-dialog";

/* ---------- Reading each contract in plain English ---------- */

type Group = "needs" | "soon" | "fine" | "setup" | "ended";

type Row = Contract & {
  group: Group;
  /** One sentence: what happens next, and by when */
  next: string;
  nextDate: string | null;
  nextDays: number | null;
  decisions: ReturnType<typeof decisionsFor>;
  noticeBy: string;
};

const groups: { key: Group; label: string; short: string; hint: string }[] = [
  { key: "needs", label: "Needs you", short: "Needs you", hint: "A decision is waiting, or the AI needs a person to check what it read." },
  { key: "soon", label: "Ending or renewing within 6 months", short: "Coming up", hint: "Nothing to do yet. These are the next to come up." },
  { key: "fine", label: "Running smoothly", short: "Running", hint: "Nothing due for at least six months." },
  { key: "setup", label: "Being set up", short: "Being set up", hint: "Drafts, uploads still being read, and contracts in review." },
  { key: "ended", label: "Finished", short: "Finished", hint: "Expired, terminated or archived. Kept for the record." },
];

/* Base tones throughout; urgency is carried by the tab count badge (red for Needs you, amber for Coming up) */
const countBadge = (g: Group) => (g === "needs" ? "critical" : g === "soon" ? "warning" : "outline");

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
  if (notice >= 0)
    return { group: notice <= SIX_MONTHS ? "soon" : "fine", next: `Ends ${formatDate(c.end)}. Decide what replaces it by ${formatDate(nb)}.`, nextDate: nb, nextDays: notice };
  const end = daysUntil(c.end);
  return { group: end <= SIX_MONTHS ? "soon" : "fine", next: `Ends ${formatDate(c.end)}. The notice date has passed.`, nextDate: c.end, nextDays: end };
}

/** Filters that cut across the tabs. ("Needs a decision" and "Ending within 6 months" repeated a tab, with different counts.) */
const filters: { key: string; label: string; test: (r: Row) => boolean }[] = [
  { key: "mine", label: "Mine", test: (r) => r.owner === "priya" },
  { key: "renews", label: "Renews automatically", test: (r) => !!r.autoRenew && r.status === "Active" },
  { key: "big", label: "Over £1m a year", test: (r) => (r.annualValue ?? 0) >= 1_000_000 },
];

const href = (r: Row) => (r.extraction === "Ready to review" ? `/contracts/${r.id}/review` : `/contracts/${r.id}`);
const ownerName = (id: string | null) => (id ? people[id].name.replace(/^Dr /, "") : "No owner");

function money(r: Contract, compact = true) {
  if (r.annualValue) return r.currency === "USD" ? `$${r.annualValue.toLocaleString("en-GB")} a year` : `${gbp(r.annualValue, { compact })} a year`;
  if (r.totalValue) return r.currency === "USD" ? `$${r.totalValue.toLocaleString("en-GB")} in total` : `${gbp(r.totalValue, { compact })} in total`;
  return "Value not recorded";
}

/** When the next thing happens, as a badge: red within a week (or overdue), amber within a month, outline after that */
const dueBadge = (days: number) => (days <= 7 ? "critical" : days <= 31 ? "warning" : "outline");
const tone = (days: number) => (days <= 7 ? "text-critical" : days <= 31 ? "text-warning" : "text-muted-foreground");

function when(days: number) {
  if (days < 0) return `${-days} ${days === -1 ? "day" : "days"} ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 60) return `In ${days} days`;
  return `In ${Math.round(days / 30)} months`;
}

/** Five columns once the page panel (the main @container) is wide enough; stacked below that, whatever the screen size */
const cols = "@4xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1.35fr)_6.25rem_8.5rem_8rem]";

/* ---------- The page ---------- */

export function ContractGroups({ live, annual }: { live: number; annual: number }) {
  const [q, setQ] = useState("");
  const [on, setOn] = useState<string[]>([]);
  const [tab, setTab] = useState<Group>("needs");
  const [peek, setPeek] = useState<Row | null>(null);
  const opener = useRef<HTMLElement | null>(null); // the preview has no Radix trigger, so return focus to the row by hand
  const [statusOverride, setStatusOverride] = useState<Record<string, ContractStatus>>({});
  const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      workspace
        .map((c) => ({ ...c, status: statusOverride[c.id] ?? c.status }))
        .filter((c) => c.status !== "Deleted")
        .map((c) => ({ ...c, ...read(c), decisions: decisionsFor(c.id), noticeBy: noticeBy(c) }))
        .sort((a, b) => (a.nextDate ?? "9999").localeCompare(b.nextDate ?? "9999")),
    [statusOverride],
  );

  const match = rows.filter(
    (r) =>
      on.every((k) => filters.find((f) => f.key === k)!.test(r)) &&
      (!q || `${r.title} ${r.supplier ?? ""} ${r.category} ${r.businessUnit ?? ""}`.toLowerCase().includes(q.toLowerCase())),
  );

  function setStatus(r: Row, s: ContractStatus) {
    const before = r.status;
    setStatusOverride((m) => ({ ...m, [r.id]: s }));
    setPeek(null);
    toast(`${r.title} ${s === "Deleted" ? "deleted" : "archived"}`, {
      action: { label: "Undo", onClick: () => setStatusOverride((m) => ({ ...m, [r.id]: before })) },
      duration: Infinity, // WCAG 2.2.1: no time limit on Undo
    });
  }

  function exportCsv() {
    const head = ["Title", "Supplier", "Status", "What happens next", "Next date", "Start", "End", "Annual value", "Total value", "Currency", "Owner", "Type", "Business unit"];
    const lines = match.map((r) =>
      [r.title, r.supplier ?? "", r.status, r.next, r.nextDate ?? "", r.start, r.end, r.annualValue ?? "", r.totalValue ?? "", r.currency ?? "GBP", r.owner ? people[r.owner].name : "", r.category, r.businessUnit ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${match.length} contracts`);
  }

  return (
    <>
      <PageHeader
        title="Contracts"
        actions={
          <>
            <Button variant="outline" onClick={exportCsv}>
              <Download data-icon="inline-start" /> Export
            </Button>
            <UploadDialog />
          </>
        }
      >
        {live} live contracts worth about <span className="tnum text-foreground">{gbp(annual, { compact: true })}</span> a year, grouped by what they need
        from you.
      </PageHeader>

      <div className="mt-6">
        <label htmlFor="contract-search" className="sr-only">
          Search contracts
        </label>
        <InputGroup className="h-12 rounded-xl">
          <InputGroupAddon>
            <Search className="size-5" />
          </InputGroupAddon>
          <InputGroupInput
            id="contract-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search contracts, suppliers or departments"
            className="text-base"
          />
          {q && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => setQ("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ToggleGroup type="multiple" variant="outline" value={on} onValueChange={setOn} aria-label="Filters" className="flex-wrap">
          {filters.map((f) => (
            <ToggleGroupItem key={f.key} value={f.key} className="gap-1.5 px-3">
              {f.label}
              <span className="tnum text-xs">{rows.filter(f.test).length}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {on.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setOn([])}>
            Clear filters
          </Button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {match.length} {match.length === 1 ? "contract" : "contracts"}
      </p>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Group)} className="mt-8 gap-4">
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList className="h-auto">
            {groups.map((g) => {
              const n = match.filter((r) => r.group === g.key).length;
              return (
                <TabsTrigger key={g.key} value={g.key} className="gap-2 px-3 py-1.5">
                  {g.short}
                  <Badge variant={n ? countBadge(g.key) : "outline"} className="tnum">
                    {n}
                  </Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
        {groups.map((g) => {
          const items = match.filter((r) => r.group === g.key);
          return (
            <TabsContent key={g.key} value={g.key} tabIndex={-1}>
              <section aria-labelledby={`group-${g.key}-h`} className="overflow-hidden rounded-xl bg-card shadow-card">
                <div className="border-b px-5 py-4">
                  <h2 id={`group-${g.key}-h`} className="section-title">
                    {g.label}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">{g.hint}</p>
                </div>
                {items.length ? (
                  <>
                    <div aria-hidden className={cn("hidden gap-x-6 border-b bg-muted/40 px-5 py-2 text-xs text-muted-foreground @4xl:grid", cols)}>
                      <span>Contract</span>
                      <span>What happens next</span>
                      <span>When</span>
                      <span className="text-right">Value</span>
                      <span>Owner</span>
                    </div>
                    <ul className="divide-y divide-(--brand-line)">
                      {items.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={(e) => {
                              opener.current = e.currentTarget;
                              setPeek(r);
                            }}
                            className={cn("group grid w-full gap-x-6 gap-y-1.5 px-5 py-3.5 text-left transition-colors duration-(--duration-fast) hover:bg-muted/60 @4xl:items-center", cols)}
                          >
                            <span className="min-w-0">
                              <span className="block font-medium text-pretty group-hover:text-primary">{r.title}</span>
                              <span className="block truncate text-sm text-muted-foreground">{r.supplier ?? "Supplier not recorded"}</span>
                            </span>
                            <span className="min-w-0 text-sm text-pretty">{r.next}</span>
                            <span>
                              {r.nextDays !== null && g.key !== "ended" && (
                                <Badge variant={dueBadge(r.nextDays)} className="tnum">
                                  {when(r.nextDays)}
                                </Badge>
                              )}
                            </span>
                            <span className="tnum text-sm text-muted-foreground @4xl:text-right">{money(r)}</span>
                            <span className="flex items-center gap-2 text-sm text-muted-foreground">
                              <PersonAvatar id={r.owner} className="size-5" decorative />
                              <span className="truncate">{ownerName(r.owner)}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : match.length ? (
                  <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing here matches. Try another tab, or remove a filter.</p>
                ) : (
                  <div className="px-5 py-12 text-center">
                    <p className="font-medium">Nothing matches</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Remove a filter, or{" "}
                      <Link href={`/chat?q=${encodeURIComponent(q || "Which contracts need attention?")}`} className="font-medium text-primary underline underline-offset-4">
                        ask the question instead
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </section>
            </TabsContent>
          );
        })}
      </Tabs>

      <Sheet open={!!peek} onOpenChange={(o) => !o && setPeek(null)}>
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-md"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (opener.current?.isConnected) opener.current.focus(); // gone if the contract was archived or deleted
          }}
        >
          {peek && <Preview r={peek} onArchive={() => setStatus(peek, "Archived")} onDelete={() => setConfirmDelete(peek)} />}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from contracts, search and answers. The audit trail keeps a record that it existed and who deleted it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmDelete) setStatus(confirmDelete, "Deleted");
                setConfirmDelete(null);
              }}
            >
              Delete contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/* ---------- Preview ---------- */

function Preview({ r, onArchive, onDelete }: { r: Row; onArchive: () => void; onDelete: () => void }) {
  const facts: [string, React.ReactNode][] = [
    ["Value", money(r, false)],
    ["Runs", `${formatDate(r.start)} to ${formatDate(r.end)}`],
    ["Notice", r.notice ? `${r.notice} days${r.status === "Active" ? `, by ${formatDate(r.noticeBy)}` : ""}` : "None recorded"],
    ["Renews", r.autoRenew ? `Automatically, for ${r.autoRenew.months} months` : "No, it ends"],
    ["Type", `${r.category}${r.businessUnit ? ` · ${r.businessUnit}` : ""}`],
    [
      "Owner",
      <span key="o" className="inline-flex items-center gap-2">
        <PersonAvatar id={r.owner} className="size-5" decorative /> {ownerName(r.owner)}
      </span>,
    ],
  ];
  const open = r.status === "Active" ? r.decisions : [];
  return (
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
          {facts.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="tnum">{v}</dd>
            </div>
          ))}
        </dl>
        {open.length > 0 && (
          <div>
            <h3 className="text-sm font-medium">Open decisions</h3>
            <ul className="mt-2 flex flex-col gap-2">
              {open.map((d) => (
                <li key={d.id} className="rounded-lg px-3 py-2.5 text-sm shadow-xs">
                  <span className="font-medium">{d.title}</span>
                  <span className={cn("tnum mt-0.5 block text-xs", tone(daysUntil(d.due)))}>
                    {d.dueLabel} {formatDate(d.due)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
        {/* Rare and destructive: kept apart from the main actions */}
        <div className="flex flex-wrap gap-2 border-t pt-4">
          {r.status !== "Archived" && (
            <Button variant="ghost" size="sm" onClick={onArchive}>
              <Archive data-icon="inline-start" /> Archive
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 data-icon="inline-start" /> Delete
          </Button>
        </div>
      </div>
    </>
  );
}
