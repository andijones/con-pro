"use client";
// Throwaway: /proto/audit. The same trail, easier to take in: a reading column, an index rail, or a weekly digest.
import { useState } from "react";
import { ChevronDown, Download, Search } from "lucide-react";
import { TODAY } from "@/lib/dates";
import { dayKey, dayLabel, nameOf, stamp, time } from "@/lib/audit-trail";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "@/components/contravo/primitives";
import { Actor, Diff, fold, Node, RecordName, Sentence, StaffReason, useAudit, views, type Item, type OpenRecord } from "./parts";

type A = ReturnType<typeof useAudit>;
const intro = "Everything that happened in this workspace, newest first. Select a contract or request to see its whole history.";
const itemKey = (it: Item) => (it.type === "one" ? it.e.id : it.key);
const lead = (it: Item) => (it.type === "one" ? it.e : it.events[0]);
const hasDetail = (it: Item) => it.type === "run" || !!it.e.diff?.length || !!it.e.staff;

function Header({ a }: { a: A }) {
  return (
    <PageHeader
      title="Audit"
      actions={
        <Button variant="outline" onClick={a.exportCsv}>
          <Download data-icon="inline-start" /> Export for auditors
        </Button>
      }
    >
      {intro}
    </PageHeader>
  );
}

function SearchBox({ a, className, placeholder = "Search people, contracts or actions" }: { a: A; className?: string; placeholder?: string }) {
  return (
    <div className={className}>
      <label htmlFor="audit-search" className="sr-only">
        Search the trail
      </label>
      <InputGroup className="h-10">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput id="audit-search" type="search" value={a.q} onChange={(e) => a.setQ(e.target.value)} placeholder={placeholder} />
      </InputGroup>
    </div>
  );
}

function Filters({ a }: { a: A }) {
  return (
    <ToggleGroup type="single" variant="outline" value={a.view} onValueChange={(v) => v && a.setView(v as keyof typeof views)} aria-label="Show" className="flex-wrap">
      {Object.entries(views).map(([k, v]) => (
        <ToggleGroupItem key={k} value={k} className="px-3">
          {v.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const Status = ({ a }: { a: A }) => (
  <p className="sr-only" role="status" aria-live="polite">
    {a.list.length} events
  </p>
);
const Empty = () => <p className="py-16 text-center text-muted-foreground">Nothing matches. Try a different word, or show everything.</p>;

/* ---------- The reading row: time in a left gutter, then the trail, then who did what ---------- */

function ColumnEntry({ it, onRecord }: { it: Item; onRecord: OpenRecord }) {
  const [open, setOpen] = useState(false);
  const e = lead(it);
  const id = `run-${itemKey(it)}`;
  return (
    <li className="grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4">
      <time dateTime={e.at} title={stamp(e.at)} className="tnum pt-[3px] text-right text-xs text-muted-foreground">
        {time(e.at)}
      </time>
      <div className="relative border-l pb-6 pl-7">
        <Node e={e} />
        <p className="flex items-start gap-2 text-[15px] leading-6">
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

function ColumnDays({ a }: { a: A }) {
  return (
    <>
      {a.days.map((d) => {
        const dayEvents = a.list.filter((e) => dayKey(e.at) === d);
        return (
          <section key={d} id={`day-${d}`} aria-labelledby={`day-${d}-h`} className="mt-6 scroll-mt-(--page-bar-offset)">
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
                <ColumnEntry key={itemKey(it)} it={it} onRecord={a.openRecord} />
              ))}
            </ol>
          </section>
        );
      })}
      {!a.list.length && <Empty />}
    </>
  );
}

/* ---------- 1. Column: one readable column, time on the left, days pinned while you scroll ---------- */

export function Column() {
  const a = useAudit();
  return (
    <>
      <Header a={a} />
      <div className="max-w-[46rem]">
        <div className="flex flex-col gap-3">
          <SearchBox a={a} />
          <Filters a={a} />
        </div>
        <Status a={a} />
        <ColumnDays a={a} />
      </div>
      {a.drawer}
    </>
  );
}

/* ---------- 2. Index: the column, with search, filters, export and a jump-to-day list in a sticky rail ---------- */

export function Index() {
  const a = useAudit();
  const counts = a.days.map((d) => ({ d, n: a.list.filter((e) => dayKey(e.at) === d).length }));
  return (
    <>
      <Header a={a} />
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,46rem)]">
        <aside className="min-w-0 lg:sticky lg:top-(--page-bar-offset) lg:self-start">
          <SearchBox a={a} placeholder="Search the trail" />
          <nav aria-label="Show" className="mt-5">
            <p className="mb-1.5 px-2 text-xs text-muted-foreground">Show</p>
            <ul className="flex flex-col gap-0.5">
              {Object.entries(views).map(([k, v]) => {
                const on = a.view === k;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => a.setView(k as keyof typeof views)}
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
          <nav aria-label="Jump to a day" className="mt-6 hidden lg:block">
            <p className="mb-1.5 px-2 text-xs text-muted-foreground">Days</p>
            <ul className="scroll-subtle flex max-h-[calc(100dvh_-_24rem)] flex-col gap-0.5 overflow-y-auto">
              {counts.map(({ d, n }) => (
                <li key={d}>
                  <a href={`#day-${d}`} className="flex h-8 items-center justify-between gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted/60 hover:text-foreground">
                    <span className="truncate">{dayLabel(d)}</span>
                    <span className="tnum text-xs">{n}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>
        <div className="min-w-0">
          <Status a={a} />
          <div className="-mt-6">
            <ColumnDays a={a} />
          </div>
        </div>
      </div>
      {a.drawer}
    </>
  );
}

/* ---------- 3. Digest: a card per week, one line per event, details on request ---------- */

const DAY = 86_400_000;
function weekOf(iso: string) {
  const d = new Date(`${dayKey(iso)}T12:00:00Z`);
  const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
  return monday.toISOString().slice(0, 10);
}
function weekLabel(key: string) {
  const thisWeek = weekOf(TODAY.toISOString());
  const last = new Date(new Date(`${thisWeek}T12:00:00Z`).getTime() - 7 * DAY).toISOString().slice(0, 10);
  if (key === thisWeek) return "This week";
  if (key === last) return "Last week";
  return `Week of ${new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}`;
}

function DigestRow({ it, onRecord }: { it: Item; onRecord: OpenRecord }) {
  const [open, setOpen] = useState(false);
  const e = lead(it);
  const id = `d-${itemKey(it)}`;
  const more = hasDetail(it);
  return (
    <li className="border-b border-(--brand-line) last:border-b-0">
      <div className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-start gap-x-3 px-4 py-2.5">
        <time dateTime={e.at} title={stamp(e.at)} className="tnum pt-0.5 text-xs text-muted-foreground">
          {time(e.at)}
        </time>
        <p className="flex min-w-0 items-start gap-2 text-sm leading-5">
          <Actor who={e.who} className="size-5 shrink-0" />
          {it.type === "one" ? (
            <Sentence e={e} onRecord={onRecord} />
          ) : (
            <span className="text-pretty">
              <span className="font-medium">{nameOf(e)}</span> <span className="text-muted-foreground">made {it.events.length} changes to</span>{" "}
              <RecordName e={e} onRecord={onRecord} />
            </span>
          )}
        </p>
        {more ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((o) => !o)}
            className="hit-area-y -my-0.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-muted hover:text-foreground"
          >
            {it.type === "run" ? `${it.events.length} changes` : e.staff ? "Reason" : "Details"}
            <ChevronDown className={cn("size-3.5 transition-transform duration-(--duration-fast)", open && "rotate-180")} aria-hidden />
          </button>
        ) : (
          <span />
        )}
      </div>
      {more && (
        <div id={id} hidden={!open} className="pr-4 pb-3 pl-[4.75rem]">
          {it.type === "one" ? (
            <>
              <Diff e={e} />
              <StaffReason e={e} />
            </>
          ) : (
            <ol className="flex flex-col gap-3 rounded-lg bg-muted/60 p-3">
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
          )}
        </div>
      )}
    </li>
  );
}

export function Digest() {
  const a = useAudit();
  const weeks = [...new Set(a.list.map((e) => weekOf(e.at)))];
  return (
    <>
      <Header a={a} />
      <div className="max-w-[52rem]">
        <div className="flex flex-wrap items-center gap-3">
          <SearchBox a={a} className="min-w-60 flex-1" />
          <Filters a={a} />
        </div>
        <Status a={a} />
        <div className="mt-8 flex flex-col gap-8">
          {weeks.map((w) => {
            const wk = a.list.filter((e) => weekOf(e.at) === w);
            const who = [...new Set(wk.map((e) => e.who))];
            const days = [...new Set(wk.map((e) => dayKey(e.at)))];
            return (
              <section key={w} aria-labelledby={`wk-${w}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 id={`wk-${w}`} className="section-title flex items-baseline gap-2">
                    {weekLabel(w)}
                    <span className="tnum text-sm font-normal text-muted-foreground">
                      {wk.length} {wk.length === 1 ? "event" : "events"}
                    </span>
                  </h2>
                  <div className="flex -space-x-1.5" role="img" aria-label={`${who.length} ${who.length === 1 ? "person or system" : "people and systems"} involved`}>
                    {who.map((w2) => (
                      <Actor key={w2} who={w2} className="size-6 ring-2 ring-background" />
                    ))}
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl bg-card shadow-card">
                  {days.map((d) => {
                    const dayEvents = wk.filter((e) => dayKey(e.at) === d);
                    return (
                      <div key={d}>
                        <h3 className="flex items-baseline justify-between gap-2 border-b border-(--brand-line) bg-muted/50 px-4 py-1.5 text-xs font-medium text-muted-foreground">
                          {dayLabel(d)}
                          <span className="tnum font-normal">{dayEvents.length}</span>
                        </h3>
                        <ol>
                          {fold(dayEvents).map((it) => (
                            <DigestRow key={itemKey(it)} it={it} onRecord={a.openRecord} />
                          ))}
                        </ol>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {!a.list.length && <Empty />}
        </div>
      </div>
      {a.drawer}
    </>
  );
}

