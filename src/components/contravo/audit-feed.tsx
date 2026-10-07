"use client";

/**
 * Audit ("Index"): a GitHub-style trail in one readable column, with a sticky rail beside it for search, what to
 * show and a jump-to-day list. Each event reads time → who → what on one line (the time sits in a left gutter);
 * edits show before → after; any record name opens that record's full history in a right-hand drawer.
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
import { PageHeader, PersonAvatar } from "./primitives";

type OpenRecord = (key: string) => void;

const views = {
  all: { label: "Everything", test: () => true },
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
        Everything that happened in this workspace, newest first. Select a contract or request to see its whole history. Anything Contravo staff do shows
        the reason they gave.
      </PageHeader>

      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,46rem)]">
        {/* The rail: search, what to show, and a jump to any day. Sticky beside the trail from lg. */}
        <aside className="min-w-0 lg:sticky lg:top-(--page-bar-offset) lg:self-start">
          <label htmlFor="audit-search" className="sr-only">
            Search the trail
          </label>
          <InputGroup className="h-10">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput id="audit-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the trail" />
          </InputGroup>
          <nav aria-label="Show" className="mt-5">
            <p className="mb-1.5 px-2 text-xs text-muted-foreground">Show</p>
            <ul className="flex flex-wrap gap-0.5 lg:flex-col">
              {Object.entries(views).map(([k, v]) => {
                const on = view === k;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => setView(k as keyof typeof views)}
                      className={cn(
                        "flex h-8 w-full items-center rounded-md px-2 text-left text-sm transition-colors duration-(--duration-fast)",
                        on ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {v.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          {days.length > 0 && (
            <nav aria-label="Jump to a day" className="mt-6 hidden lg:block">
              <p className="mb-1.5 px-2 text-xs text-muted-foreground">Days</p>
              <ul className="scroll-subtle flex max-h-[calc(100dvh_-_24rem)] flex-col gap-0.5 overflow-y-auto">
                {days.map((d) => (
                  <li key={d}>
                    <a
                      href={`#day-${d}`}
                      className="flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted/60 hover:text-foreground"
                    >
                      <span className="truncate">{dayLabel(d)}</span>
                      <span className="tnum text-xs">{list.filter((e) => dayKey(e.at) === d).length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        <div className="min-w-0">
          <p className="sr-only" role="status" aria-live="polite">
            {list.length} events
          </p>
          {days.map((d, i) => {
            const dayEvents = list.filter((e) => dayKey(e.at) === d);
            return (
              <section key={d} id={`day-${d}`} aria-labelledby={`day-${d}-h`} className={cn("scroll-mt-(--page-bar-offset)", i > 0 && "mt-6")}>
                {/* Pinned while you read the day; the page background keeps it legible over the trail */}
                <h2
                  id={`day-${d}-h`}
                  className="sticky top-(--page-bar-offset) z-(--z-sticky) -mx-2 mb-2 flex items-baseline gap-2 rounded-md bg-background/95 px-2 py-2 text-sm font-medium backdrop-blur-sm"
                >
                  {dayLabel(d)}
                  <span className="tnum font-normal text-muted-foreground">{dayEvents.length}</span>
                </h2>
                <ol>
                  {fold(dayEvents).map((it) => (
                    <Entry key={it.type === "one" ? it.e.id : it.key} it={it} onRecord={openRecord} />
                  ))}
                </ol>
              </section>
            );
          })}
          {!list.length && <p className="py-16 text-center text-muted-foreground">Nothing matches. Try a different word, or show everything.</p>}
        </div>
      </div>

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
      <button type="button" aria-haspopup="dialog" onClick={() => onRecord(e.object!.key)} className="text-left font-medium underline decoration-input hover:decoration-primary">
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

/** One event (or a folded run) in the trail: the time in a left gutter, the trail line, then who did what */
function Entry({ it, onRecord }: { it: Item; onRecord: OpenRecord }) {
  const [open, setOpen] = useState(false);
  const e = it.type === "one" ? it.e : it.events[0];
  const id = `run-${it.type === "one" ? it.e.id : it.key}`;
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4">
      <time dateTime={e.at} title={`${stamp(e.at)} · ${ago(e.at)}`} className="tnum pt-[3px] text-right text-xs text-muted-foreground">
        {time(e.at)}
      </time>
      <div className="relative border-l pb-6 pl-7">
        <Node e={e} />
        <p className="flex items-start gap-2 text-reading leading-6">
          <Actor who={e.who} className="mt-0.5 size-5 shrink-0" />
          {it.type === "one" ? (
            <Sentence e={e} onRecord={onRecord} />
          ) : (
            <span className="text-pretty">
              <span className="font-medium">{nameOf(e)}</span> <span className="text-muted-foreground">made {it.events.length} changes to</span>{" "}
              <RecordName e={e} onRecord={onRecord} />
            </span>
          )}
        </p>
        {it.type === "one" ? (
          <div className="pl-7">
            <Diff e={e} />
            <StaffReason e={e} />
          </div>
        ) : (
          <>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={id}
              onClick={() => setOpen((o) => !o)}
              className="hit-area-y mt-1 ml-7 inline-flex items-center gap-1 text-sm font-medium text-primary"
            >
              <ChevronDown className={cn("size-4 transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
              {open ? "Hide" : "Show"} the {it.events.length} changes
            </button>
            <ol id={id} hidden={!open} className="mt-2 ml-7 flex flex-col gap-3 rounded-lg bg-muted/60 p-3">
              {it.events.map((x) => (
                <li key={x.id} className="text-sm">
                  <span className="flex flex-wrap justify-between gap-2">
                    <Sentence e={x} withName={false} withObject={false} />
                    <time dateTime={x.at} className="tnum text-xs text-muted-foreground">
                      {time(x.at)}
                    </time>
                  </span>
                  <Diff e={x} />
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </li>
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
            <p className="text-reading leading-6">
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
