"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Download, MoreVertical, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import type { Contract, ContractStatus } from "@/lib/data";
import { businessUnits, contractStatuses, contractTypes, people } from "@/lib/data";
import { daysUntil, formatDate, gbp } from "@/lib/dates";
import { urgency } from "@/lib/derive";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ExtractionBadge, PersonAvatar, StatusBadge } from "./primitives";
import { UploadDialog } from "./upload-dialog";

export type RegisterRow = Contract & { next: { date: string; label: string }; open: number };

const views = [
  { key: "all", label: "All" },
  { key: "decisions", label: "Needs a decision" },
  { key: "to-check", label: "Details to check" },
  { key: "renews", label: "Renews automatically" },
  { key: "gaps", label: "Missing information" },
] as const;
type View = (typeof views)[number]["key"];

type SortKey = "title" | "status" | "next" | "end" | "uploaded";
const ALL = "__all";

export function ContractRegister({
  rows,
  initialStatus,
  initialView,
}: {
  rows: RegisterRow[];
  initialStatus?: string;
  initialView?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [view, setView] = useState<View>((views.find((v) => v.key === initialView)?.key as View) ?? "all");
  const [status, setStatus] = useState<string>(initialStatus && contractStatuses.includes(initialStatus as ContractStatus) ? initialStatus : ALL);
  const [type, setType] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [unit, setUnit] = useState(ALL);
  const [counterparty, setCounterparty] = useState(ALL);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "next", dir: 1 });
  const [removed, setRemoved] = useState<Record<string, ContractStatus>>({});
  const [confirmDelete, setConfirmDelete] = useState<RegisterRow | null>(null);

  const counterparties = Array.from(new Set(rows.map((r) => r.supplier).filter(Boolean))) as string[];

  const statusOf = (r: RegisterRow) => removed[r.id] ?? r.status;

  const inView = (r: RegisterRow, v: View) => {
    if (v === "decisions") return r.open > 0;
    if (v === "to-check") return r.extraction === "Ready to review";
    if (v === "renews") return !!r.autoRenew;
    if (v === "gaps") return !!r.flags?.length || !r.supplier || (!r.annualValue && !r.totalValue);
    return true;
  };

  const visible = useMemo(() => {
    const list = rows.filter((r) => {
      const s = statusOf(r);
      if (status === ALL ? s === "Deleted" : s !== status) return false;
      if (!inView(r, view)) return false;
      if (type !== ALL && r.category !== type) return false;
      if (owner !== ALL && (r.owner ?? "none") !== owner) return false;
      if (unit !== ALL && (r.businessUnit ?? "none") !== unit) return false;
      if (counterparty !== ALL && r.supplier !== counterparty) return false;
      if (q) {
        const hay = `${r.title} ${r.fileName ?? ""} ${r.supplier ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    const val = (r: RegisterRow): string =>
      sort.key === "title"
        ? r.title
        : sort.key === "status"
          ? String(contractStatuses.indexOf(statusOf(r))).padStart(2, "0")
          : sort.key === "end"
            ? r.end
            : sort.key === "uploaded"
              ? (r.uploaded ?? "")
              : ["Active", "Under review", "Legal review"].includes(statusOf(r))
                ? r.next.date
                : `9${r.next.date}`; // nothing to act on: sort after live contracts
    return list.sort((a, b) => val(a).localeCompare(val(b)) * sort.dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, view, status, type, owner, unit, counterparty, sort, removed]);

  const filtersOn = [status, type, owner, unit, counterparty].some((f) => f !== ALL) || q;

  function clearFilters() {
    setQ("");
    setStatus(ALL);
    setType(ALL);
    setOwner(ALL);
    setUnit(ALL);
    setCounterparty(ALL);
  }

  function exportCsv() {
    const head = ["Title", "File", "Status", "Type", "Business unit", "Owner", "Counterparty", "Review date", "Next deadline", "End date", "Total value (GBP)", "Uploaded"];
    const lines = visible.map((r) =>
      [
        r.title,
        r.fileName ?? "",
        statusOf(r),
        r.category,
        r.businessUnit ?? "",
        r.owner ? people[r.owner].name : "",
        r.supplier ?? "",
        r.reviewDate ?? "",
        r.next.date,
        r.end,
        r.currency === "USD" ? "" : (r.totalValue ?? ""),
        r.uploaded ?? "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `contracts-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${visible.length} contracts`);
  }

  function setRowStatus(r: RegisterRow, s: ContractStatus) {
    const before = statusOf(r);
    setRemoved((m) => ({ ...m, [r.id]: s }));
    toast(`${r.title} ${s === "Deleted" ? "deleted" : "archived"}`, {
      action: { label: "Undo", onClick: () => setRemoved((m) => ({ ...m, [r.id]: before })) },
      duration: Infinity, // WCAG 2.2.1: no time limit on Undo
    });
  }



  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(v) => v && setView(v as View)}
          aria-label="Quick views"
          className="flex-wrap"
        >
          {views.map((v) => (
            <ToggleGroupItem key={v.key} value={v.key} className="gap-1.5 px-3">
              {v.label}
              <span className="tnum text-xs">{rows.filter((r) => statusOf(r) !== "Deleted" && inView(r, v.key)).length}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download data-icon="inline-start" /> Export CSV
          </Button>
          <UploadDialog />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-full sm:w-60">
          <FieldLabel htmlFor="search" className="text-xs text-muted-foreground">
            Search
          </FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput id="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title or counterparty" />
          </InputGroup>
        </Field>
        <FilterSelect id="f-status" label="Status" value={status} onChange={setStatus} options={contractStatuses.map((s) => ({ value: s, label: s }))} />
        <FilterSelect id="f-type" label="Contract type" value={type} onChange={setType} options={contractTypes.map((s) => ({ value: s, label: s }))} />
        <FilterSelect
          id="f-owner"
          label="Owner"
          value={owner}
          onChange={setOwner}
          options={[...Object.values(people).map((p) => ({ value: p.id, label: p.name })), { value: "none", label: "No owner" }]}
        />
        <FilterSelect
          id="f-unit"
          label="Business unit"
          value={unit}
          onChange={setUnit}
          options={[...businessUnits.map((s) => ({ value: s, label: s })), { value: "none", label: "None recorded" }]}
        />
        <FilterSelect id="f-cp" label="Counterparty" value={counterparty} onChange={setCounterparty} options={counterparties.map((s) => ({ value: s, label: s }))} />
        {filtersOn && (
          <Button variant="ghost" onClick={clearFilters}>
            <X data-icon="inline-start" /> Clear
          </Button>
        )}
      </div>

      <Card className="py-0">
        {visible.length ? (
          <Table className="min-w-[1180px]" scrollLabel="Contracts register">
            <TableHeader>
              <TableRow className="text-xs">
                <SortHead sort={sort} onSort={setSort} k="title" className="pl-4">
                  Contract
                </SortHead>
                <SortHead sort={sort} onSort={setSort} k="status">Status</SortHead>
                <TableHead>Type</TableHead>
                <TableHead>Business unit</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Counterparty</TableHead>
                <SortHead sort={sort} onSort={setSort} k="next">Next date that matters</SortHead>
                <TableHead>Review date</TableHead>
                <SortHead sort={sort} onSort={setSort} k="end">End date</SortHead>
                <TableHead className="text-right">Total value</TableHead>
                <SortHead sort={sort} onSort={setSort} k="uploaded">Uploaded</SortHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => {
                const s = statusOf(r);
                const u = urgency(daysUntil(r.next.date));
                const href = r.extraction === "Ready to review" ? `/contracts/${r.id}/review` : `/contracts/${r.id}`;
                const live = ["Active", "Under review", "Legal review"].includes(s);
                return (
                  <TableRow key={r.id} className="group">
                    <TableCell className="max-w-[300px] py-3 pl-4">
                      <Link href={href} className="block truncate font-medium group-hover:text-primary">
                        {r.title}
                      </Link>
                      <span className="block truncate text-xs text-muted-foreground">{r.fileName}</span>
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <StatusBadge status={s} />
                        <ExtractionBadge state={r.extraction} />
                        {r.open > 0 && (
                          <span className="tnum text-xs text-primary">
                            {r.open} {r.open === 1 ? "decision" : "decisions"}
                          </span>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{r.category}</TableCell>
                    <TableCell>{r.businessUnit ?? <Dash />}</TableCell>
                    <TableCell>{r.owner ? <PersonAvatar id={r.owner} /> : <Dash />}</TableCell>
                    <TableCell className="max-w-[180px] truncate">{r.supplier ?? <Dash />}</TableCell>
                    <TableCell>
                      {live ? (
                        <span className="flex flex-col leading-tight">
                          <span
                            className={cn(
                              "tnum font-medium",
                              (u === "urgent" || u === "overdue") && "text-critical",
                              u === "soon" && "text-warning",
                            )}
                          >
                            {formatDate(r.next.date)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {r.next.label}
                            {r.autoRenew && r.next.label.includes("renews") && <RefreshCw className="ml-1 inline size-2.5" aria-hidden />}
                          </span>
                        </span>
                      ) : (
                        <Dash />
                      )}
                    </TableCell>
                    <TableCell className="tnum">{r.reviewDate ? formatDate(r.reviewDate) : <Dash />}</TableCell>
                    <TableCell className="tnum text-muted-foreground">{r.extraction === "Reviewed" ? formatDate(r.end) : <Dash />}</TableCell>
                    <TableCell className="tnum text-right">
                      {r.totalValue ? (
                        <span className="inline-flex items-center gap-1.5">
                          {r.currency === "USD" && <AlertTriangle className="size-3 text-warning" aria-label="Held in US dollars" />}
                          {r.currency === "USD" ? `$${r.totalValue.toLocaleString("en-GB")}` : gbp(r.totalValue)}
                        </span>
                      ) : (
                        <Dash />
                      )}
                    </TableCell>
                    <TableCell className="tnum text-muted-foreground">{r.uploaded ? formatDate(r.uploaded) : <Dash />}</TableCell>
                    <TableCell className="pr-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.title}`}>
                            <MoreVertical />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => router.push(`/contracts/${r.id}`)}>Open contract</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => router.push(`/contracts/${r.id}/review`)}>Review what the AI read</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => router.push(`/contracts/${r.id}/details`)}>Edit details</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => router.push(`/chat?q=${encodeURIComponent(`Tell me about the ${r.title} contract`)}`)}>
                            Ask about this contract
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onSelect={() => setRowStatus(r, "Archived")}>Archive</DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(r)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyTitle>No contracts match</EmptyTitle>
              <EmptyDescription>
                Try clearing the filters, or{" "}
                <Link href={`/chat?q=${encodeURIComponent(q || "Which contracts need attention?")}`}>ask a question instead</Link>.
              </EmptyDescription>
            </EmptyHeader>
            {filtersOn && (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </Empty>
        )}
      </Card>
      <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
        Showing {visible.length} {visible.length === 1 ? "contract" : "contracts"}
        {status === ALL && " · deleted contracts are hidden unless you filter by Deleted"}
      </p>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.title}?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be hidden from the register, search and answers. The audit trail keeps a record that it existed and who deleted it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (confirmDelete) setRowStatus(confirmDelete, "Deleted");
                setConfirmDelete(null);
              }}
            >
              Delete contract
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type Sort = { key: SortKey; dir: 1 | -1 };

function SortHead({
  k,
  sort,
  onSort,
  children,
  className,
}: {
  k: SortKey;
  sort: Sort;
  onSort: (s: Sort) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const on = sort.key === k;
  const Icon = !on ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <TableHead className={className} aria-sort={on ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button
        className="-ml-1 inline-flex min-h-6 items-center gap-1 rounded px-1 hover:text-foreground"
        onClick={() => onSort({ key: k, dir: on ? ((sort.dir * -1) as 1 | -1) : 1 })}
      >
        {children}
        <Icon className={cn("size-3", !on && "opacity-40")} aria-hidden />
      </button>
    </TableHead>
  );
}

function Dash() {
  return <span className="text-muted-foreground">—</span>;
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field className="w-auto">
      <FieldLabel htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="min-w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          <SelectSeparator />
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

