"use client";

/**
 * Contracts: grouped by what each contract needs, with search, filters and a preview.
 * Decision record: docs/decisions/contracts.md
 */
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Archive, ArrowRight, ChevronDown, Download, MessageSquare, Search, Trash2, X } from "lucide-react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PersonAvatar, StatusBadge } from "./primitives";
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

const groups: { key: Group; label: string; hint: string }[] = [
  { key: "needs", label: "Needs you", hint: "A decision is waiting, or the AI needs a person to check what it read." },
  { key: "soon", label: "Ending or renewing within 6 months", hint: "Nothing to do yet. These are the next to come up." },
  { key: "fine", label: "Running smoothly", hint: "Nothing due for at least six months." },
  { key: "setup", label: "Being set up", hint: "Drafts, uploads still being read, and contracts in review." },
  { key: "ended", label: "Finished", hint: "Expired, terminated or archived. Kept for the record." },
];

/**
 * One tonal ramp from the brand base colours, quieter as urgency drops:
 * Lilac → light Lilac → Frost → Frost → White. Text stays Midnight on every step (AA).
 */
const groupTone: Record<Group, { head: string; badge: "default" | "secondary" | "outline"; hover: string }> = {
  needs: { head: "bg-highlight", badge: "default", hover: "hover:bg-highlight/40" },
  soon: { head: "bg-accent", badge: "secondary", hover: "hover:bg-accent/60" },
  fine: { head: "bg-muted", badge: "outline", hover: "hover:bg-muted/60" },
  setup: { head: "bg-muted", badge: "outline", hover: "hover:bg-muted/60" },
  ended: { head: "bg-background", badge: "outline", hover: "hover:bg-muted/60" },
};

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

const filters: { key: string; label: string; test: (r: Row) => boolean }[] = [
  { key: "mine", label: "Mine", test: (r) => r.owner === "priya" },
  { key: "decision", label: "Needs a decision", test: (r) => r.decisions.length > 0 && r.status === "Active" },
  { key: "check", label: "Details to check", test: (r) => r.extraction === "Ready to review" },
  { key: "ending", label: "Ending within 6 months", test: (r) => r.status === "Active" && r.nextDays !== null && r.nextDays <= SIX_MONTHS },
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

/** Urgency as text colour, always alongside words (WCAG 1.4.1) */
const tone = (days: number | null) => (days === null ? "text-muted-foreground" : days <= 7 ? "text-critical" : days <= 31 ? "text-warning" : "text-muted-foreground");

function when(days: number | null) {
  if (days === null) return "";
  if (days < 0) return `${-days} days ago`;
  if (days === 0) return "today";
  if (days < 60) return `in ${days} days`;
  return `in ${Math.round(days / 30)} months`;
}

/* ---------- The page ---------- */

export function ContractGroups({ live, annual }: { live: number; annual: number }) {
  const [q, setQ] = useState("");
  const [on, setOn] = useState<string[]>([]);
  const [closed, setClosed] = useState<Group[]>(["soon", "fine", "setup", "ended"]); // only "Needs you" starts open
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

  const narrowing = !!q || on.length > 0;
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="heading text-[2.25rem]">Contracts</h1>
          <p className="mt-2 text-base text-muted-foreground">
            {live} live contracts worth about <span className="tnum text-foreground">{gbp(annual, { compact: true })}</span> a year, grouped by what they need
            from you.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download data-icon="inline-start" /> Export
          </Button>
          <UploadDialog />
        </div>
      </div>

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

      <div className="mt-8 flex flex-col gap-4">
        {groups.map((g) => {
          const items = match.filter((r) => r.group === g.key);
          if (!items.length) return null;
          const isOpen = !closed.includes(g.key) || narrowing; // searching or filtering opens every section with matches
          const panel = `group-${g.key}`;
          const t = groupTone[g.key];
          return (
            <section key={g.key} aria-labelledby={`${panel}-h`} className="overflow-hidden rounded-xl bg-card shadow-card">
              <h2 id={`${panel}-h`}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panel}
                  onClick={() => setClosed((c) => (c.includes(g.key) ? c.filter((x) => x !== g.key) : [...c, g.key]))}
                  className={cn("flex w-full items-center gap-3 px-5 py-4 text-left", t.head)}
                >
                  <span className="flex-1">
                    <span className="flex items-center gap-2 text-base font-medium">
                      {g.label}
                      <Badge variant={t.badge} className="tnum">
                        {items.length}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-sm font-normal text-foreground/70">{g.hint}</span>
                  </span>
                  <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-(--duration-fast)", isOpen && "rotate-180")} aria-hidden />
                </button>
              </h2>
              <ul id={panel} hidden={!isOpen} className="border-t">
                {items.map((r) => (
                  <li key={r.id} className="border-b last:border-b-0">
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={(e) => {
                        opener.current = e.currentTarget;
                        setPeek(r);
                      }}
                      className={cn(
                        "group grid w-full gap-x-6 gap-y-1 px-5 py-4 text-left transition-colors duration-(--duration-fast) md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_9rem_8rem] md:items-center",
                        t.hover,
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium group-hover:text-primary">{r.title}</span>
                        <span className="block truncate text-sm text-muted-foreground">{r.supplier ?? "Supplier not recorded"}</span>
                      </span>
                      <span className="min-w-0 text-sm text-pretty">
                        {r.next}
                        {r.nextDays !== null && g.key !== "ended" && <span className={cn("tnum ml-1.5 font-medium whitespace-nowrap", tone(r.nextDays))}>{when(r.nextDays)}</span>}
                      </span>
                      <span className="tnum text-sm text-muted-foreground md:text-right">{money(r)}</span>
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <PersonAvatar id={r.owner} className="size-5" decorative />
                        <span className="truncate">{ownerName(r.owner)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {!match.length && (
          <div className="rounded-xl bg-card px-5 py-14 text-center shadow-xs">
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
      </div>

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
