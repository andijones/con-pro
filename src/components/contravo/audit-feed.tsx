"use client";

/**
 * Audit: a GitHub-style trail. Days as headings, one sentence per event, edits as before → after.
 * Any record name opens that record's full history in a right-hand drawer.
 * Decision record: docs/decisions/audit.md
 */
import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bot, ChevronDown, Download, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { people } from "@/lib/data";
import { ago, dayKey, dayLabel, events, kinds, nameOf, records, stamp, time, type AuditRecord, type Ev } from "@/lib/audit-trail";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader, PersonAvatar } from "./primitives";

type OpenRecord = (key: string) => void;

const views = {
  all: { label: "Everything", test: (_: Ev) => true },
  people: { label: "People", test: (e: Ev) => e.who !== "system" && e.who !== "staff" },
  contravo: { label: "Contravo", test: (e: Ev) => e.who === "system" || e.who === "staff" },
  changes: { label: "Changes only", test: (e: Ev) => ["edited", "status", "assigned", "deleted", "uploaded", "staff"].includes(e.kind) },
};

type Item = { type: "one"; e: Ev } | { type: "run"; key: string; events: Ev[] };

/** Fold runs: the same person doing several things to the same record, back to back */
function fold(list: Ev[]): Item[] {
  const out: Item[] = [];
  for (const e of list) {
    const last = out.at(-1);
    const prev = last?.type === "one" ? last.e : last?.type === "run" ? last.events[0] : null;
    if (prev && e.object && prev.who === e.who && prev.object?.key === e.object.key) {
      if (last!.type === "one") out[out.length - 1] = { type: "run", key: prev.id, events: [prev, e] };
      else last!.events.push(e);
    } else out.push({ type: "one", e });
  }
  return out;
}

export function AuditFeed() {
  const [view, setView] = useState<keyof typeof views>("all");
  const [q, setQ] = useState("");
  const [recordKey, setRecordKey] = useState<string | null>(null);
  const opener = useRef<HTMLElement | null>(null); // the drawer has no Radix trigger, so focus is returned by hand
  const record = records.find((r) => r.key === recordKey);

  const list = events.filter((e) => views[view].test(e) && (!q || `${nameOf(e)} ${e.what} ${e.object?.label ?? ""} ${e.detail ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const days = [...new Set(list.map((e) => dayKey(e.at)))];

  const openRecord: OpenRecord = (key) => {
    opener.current = document.activeElement as HTMLElement;
    setRecordKey(key);
  };

  return (
    <>
      <PageHeader
        title="Audit"
        actions={
          <Button variant="outline" onClick={() => toast.success(`Exported ${list.length} events`, { description: "CSV, signed with a checksum for auditors" })}>
            <Download data-icon="inline-start" /> Export for auditors
          </Button>
        }
      >
        Everything that happened in this workspace, newest first. Select any contract or request to see its whole history. Contravo’s own actions are included, and
        anything Contravo staff do shows the reason they gave.
      </PageHeader>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <label htmlFor="audit-search" className="sr-only">
            Search the trail
          </label>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput id="audit-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search people, contracts or actions" />
          </InputGroup>
        </div>
        <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v as keyof typeof views)} aria-label="Show" className="flex-wrap">
          {Object.entries(views).map(([k, v]) => (
            <ToggleGroupItem key={k} value={k} className="px-3">
              {v.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <p className="sr-only" role="status" aria-live="polite">
        {list.length} events
      </p>

      {days.map((d) => {
        const dayEvents = list.filter((e) => dayKey(e.at) === d);
        return (
          <section key={d} aria-labelledby={`day-${d}`} className="mt-8">
            <h2 id={`day-${d}`} className="flex items-baseline gap-2 text-sm font-medium">
              {dayLabel(d)}
              <span className="tnum font-normal text-muted-foreground">{dayEvents.length}</span>
            </h2>
            <ol className="relative mt-3 ml-3 border-l">
              {fold(dayEvents).map((it) => (
                <li key={it.type === "one" ? it.e.id : it.key} className="relative pb-5 pl-8 last:pb-1">
                  {it.type === "one" ? <One e={it.e} onRecord={openRecord} /> : <Run events={it.events} onRecord={openRecord} />}
                </li>
              ))}
            </ol>
          </section>
        );
      })}
      {!list.length && <p className="py-16 text-center text-muted-foreground">Nothing matches. Try a different word, or show everything.</p>}

      <Sheet open={!!record} onOpenChange={(o) => !o && setRecordKey(null)}>
        <SheetContent
          className="w-full overflow-y-auto sm:max-w-lg"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            opener.current?.focus();
          }}
        >
          {record && (
            <>
              <SheetHeader className="gap-1 border-b pb-5">
                <SheetDescription>{record.kind === "foi" ? "FOI request" : "Contract"} history</SheetDescription>
                <SheetTitle className="heading text-2xl font-normal">{record.label}</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <History r={record} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

/* ---------- Pieces ---------- */

function Actor({ who, className }: { who: string; className?: string }) {
  if (people[who]) return <PersonAvatar id={who} className={cn("size-6", className)} decorative />;
  return (
    <span aria-hidden className={cn("grid size-6 place-items-center rounded-full", who === "staff" ? "bg-warning-muted text-warning" : "bg-secondary text-secondary-foreground", className)}>
      {who === "staff" ? <ShieldAlert className="size-3.5" /> : <Bot className="size-3.5" />}
    </span>
  );
}

/** The record name: opens its history when there is one, otherwise plain text */
function RecordName({ e, onRecord }: { e: Ev; onRecord?: OpenRecord }) {
  if (!e.object) return null;
  if (onRecord && e.object.href)
    return (
      <button type="button" aria-haspopup="dialog" onClick={() => onRecord(e.object!.key)} className="text-left font-medium underline decoration-input underline-offset-4 hover:decoration-primary">
        {e.object.label}
      </button>
    );
  return <span className="font-medium">{e.object.label}</span>;
}

/** "Priya Shah uploaded Linen and laundry services" */
function Sentence({ e, withName = true, withObject = true, onRecord }: { e: Ev; withName?: boolean; withObject?: boolean; onRecord?: OpenRecord }) {
  return (
    <span className="text-pretty">
      {withName && <span className="font-medium">{nameOf(e)} </span>}
      <span className="text-muted-foreground">{e.what}</span>
      {withObject && e.object && (
        <>
          {" "}
          <RecordName e={e} onRecord={onRecord} />
        </>
      )}
      {e.detail && <span className="text-muted-foreground"> · {e.detail}</span>}
    </span>
  );
}

/** Before → after, like a diff */
function Diff({ e }: { e: Ev }) {
  if (!e.diff?.length) return null;
  return (
    <dl className="mt-2 flex flex-col gap-1.5">
      {e.diff.map((d) => (
        <div key={d.field} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <dt className="w-28 shrink-0 text-muted-foreground">{d.field}</dt>
          <dd className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-critical-muted px-1.5 py-0.5 text-critical line-through decoration-critical/50">{d.from}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" aria-label="changed to" />
            <span className="rounded bg-success-muted px-1.5 py-0.5 text-success">{d.to}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StaffReason({ e }: { e: Ev }) {
  if (!e.staff) return null;
  return (
    <p className="mt-2 rounded-lg bg-warning-muted px-3 py-2 text-sm text-warning">
      <span className="font-medium">Contravo staff action. Reason given:</span> {e.staff.reason}
    </p>
  );
}

function Node({ e, ring = "ring-background" }: { e: Ev; ring?: string }) {
  const K = kinds[e.kind].icon;
  return (
    <span
      className={cn(
        "absolute top-0 -left-3 grid size-6 place-items-center rounded-full ring-4",
        ring,
        e.kind === "staff"
          ? "bg-warning-muted text-warning"
          : e.kind === "contravo"
            ? "bg-secondary text-secondary-foreground"
            : e.kind === "deleted"
              ? "bg-critical-muted text-critical"
              : "bg-muted text-muted-foreground",
      )}
      aria-hidden
    >
      <K className="size-3.5" />
    </span>
  );
}

function One({ e, onRecord }: { e: Ev; onRecord: OpenRecord }) {
  return (
    <>
      <Node e={e} />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5">
        <p className="flex min-w-0 flex-1 items-start gap-2 text-[15px] leading-6">
          <Actor who={e.who} className="mt-0.5 size-5 shrink-0" />
          <Sentence e={e} onRecord={onRecord} />
        </p>
        <time dateTime={e.at} title={stamp(e.at)} className="tnum shrink-0 pt-0.5 text-xs text-muted-foreground">
          {time(e.at)} · {ago(e.at)}
        </time>
      </div>
      <div className="pl-7">
        <Diff e={e} />
        <StaffReason e={e} />
      </div>
    </>
  );
}

function Run({ events: evs, onRecord }: { events: Ev[]; onRecord: OpenRecord }) {
  const [open, setOpen] = useState(false);
  const id = `run-${evs[0].id}`;
  return (
    <>
      <Node e={evs[0]} />
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-0.5">
        <p className="flex min-w-0 flex-1 items-start gap-2 text-[15px] leading-6">
          <Actor who={evs[0].who} className="mt-0.5 size-5 shrink-0" />
          <span>
            <span className="font-medium">{nameOf(evs[0])}</span> <span className="text-muted-foreground">made {evs.length} changes to</span>{" "}
            <RecordName e={evs[0]} onRecord={onRecord} />
          </span>
        </p>
        <time dateTime={evs.at(-1)!.at} className="tnum shrink-0 pt-0.5 text-xs text-muted-foreground">
          {time(evs.at(-1)!.at)}–{time(evs[0].at)}
        </time>
      </div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="hit-area-y mt-1 ml-7 inline-flex items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronDown className={cn("size-4 transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
        {open ? "Hide" : "Show"} the {evs.length} changes
      </button>
      <ol id={id} hidden={!open} className="mt-2 ml-7 flex flex-col gap-3 rounded-lg bg-muted/60 p-3">
        {evs.map((e) => (
          <li key={e.id} className="text-sm">
            <span className="flex flex-wrap justify-between gap-2">
              <Sentence e={e} withName={false} withObject={false} />
              <time dateTime={e.at} className="tnum text-xs text-muted-foreground">
                {time(e.at)}
              </time>
            </span>
            <Diff e={e} />
          </li>
        ))}
      </ol>
    </>
  );
}

/** One record's whole history, newest first, for the drawer */
function History({ r }: { r: AuditRecord }) {
  const involved = [...new Set(r.events.map((e) => e.who))];
  return (
    <section aria-label={`History of ${r.label}`}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b py-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">
            {r.events.length} {r.events.length === 1 ? "event" : "events"} · last {ago(r.events[0].at)} · first {stamp(r.events.at(-1)!.at)}
          </p>
          <div className="mt-3 flex -space-x-1.5" role="img" aria-label={`${involved.length} ${involved.length === 1 ? "person or system" : "people and systems"} involved`}>
            {involved.map((w) => (
              <Actor key={w} who={w} className="ring-2 ring-background" />
            ))}
          </div>
        </div>
        {r.href && (
          <Button asChild variant="outline">
            <Link href={r.href}>
              Open {r.kind === "foi" ? "request" : "contract"} <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        )}
      </div>
      <ol className="relative mt-5 ml-3 border-l">
        {r.events.map((e) => (
          <li key={e.id} className="relative pb-6 pl-8 last:pb-0">
            <Node e={e} ring="ring-popover" />
            <p className="text-[15px] leading-6">
              <Sentence e={e} withObject={false} />
            </p>
            <time dateTime={e.at} className="tnum text-xs text-muted-foreground">
              {stamp(e.at)}
            </time>
            <Diff e={e} />
            <StaffReason e={e} />
          </li>
        ))}
      </ol>
    </section>
  );
}
