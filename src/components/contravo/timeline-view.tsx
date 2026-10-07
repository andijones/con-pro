"use client";

/**
 * Timeline ("Zoom"): every contract against the calendar, zoomable to 6 months, 1 year or 3 years. Rows are grouped by
 * what each contract needs (notice missed, decide now, coming up, later, ended); the amber part of each bar is the
 * notice window. Select a row for its value, dates and renewal, and to open the contract or ask about options.
 * Decision record: docs/decisions/timeline.md
 */
import { Fragment, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import { daysLeft, formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PageHeader } from "./primitives";
import { addMonths, groups, monthLabel, monthsBetween, rows, scale, todayIso, type Row } from "@/lib/timeline";

const ranges = { "6m": { label: "6 months", months: 6 }, "1y": { label: "1 year", months: 12 }, "3y": { label: "3 years", months: 36 } } as const;
type Range = keyof typeof ranges;
const fill = { running: "bg-(--timeline-running)", notice: "bg-(--timeline-notice)", missed: "bg-(--timeline-missed)", ended: "bg-(--timeline-ended)" };

export function TimelineView() {
  const [range, setRange] = useState<Range>("1y");
  const [open, setOpen] = useState<string | null>(null);
  const from = addMonths(todayIso, -1);
  const to = addMonths(todayIso, ranges[range].months);
  const s = scale(from, to);
  const ticks = monthsBetween(from, to).filter((m) => range !== "3y" || parse3(m));
  const today = s.pct(todayIso);

  return (
    <div>
      <PageHeader title="Timeline">
        Every live contract against the calendar. The amber part of each bar is the notice window: once a contract is in it, it’s too late to give notice.
      </PageHeader>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <ToggleGroup type="single" variant="outline" size="sm" value={range} onValueChange={(v) => v && setRange(v as Range)} aria-label="Show the next">
          {Object.entries(ranges).map(([k, r]) => (
            <ToggleGroupItem key={k} value={k} className="px-3">
              {r.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Legend />
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl bg-card shadow-card">
        <div className="min-w-[880px]">
          {/* Scale */}
          <div className="sticky top-0 grid grid-cols-[17rem_1fr] border-b border-(--brand-line)">
            <div className="px-5 py-3 text-xs text-muted-foreground">Contract</div>
            <div className="relative h-11">
              {ticks.map((m) => (
                <span key={m} className="absolute top-0 h-full border-l border-(--brand-line) pt-2 pl-1.5 text-[11px] text-muted-foreground" style={{ left: `${s.pct(m)}%` }}>
                  {m.slice(5, 7) === "01" && <span className="block font-medium text-foreground">{m.slice(0, 4)}</span>}
                  {monthLabel(m)}
                </span>
              ))}
              <span className="absolute top-1 z-10 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background" style={{ left: `${today}%` }}>
                Today
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 left-[17rem]" aria-hidden>
              {ticks.map((m) => (
                <span key={m} className="absolute inset-y-0 border-l border-(--brand-line)/70" style={{ left: `${s.pct(m)}%` }} />
              ))}
              <span className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${today}%` }} />
            </div>

            {groups.map((g) => {
              const items = rows.filter((r) => r.state === g.key);
              if (!items.length) return null;
              return (
                <section key={g.key} aria-labelledby={`g-${g.key}`}>
                  <h2 id={`g-${g.key}`} className="relative flex items-baseline gap-2 border-b border-(--brand-line) bg-muted/60 px-5 py-2 text-xs font-medium">
                    {g.label}
                    <span className="tnum font-normal text-muted-foreground">{items.length}</span>
                    <span className="hidden font-normal text-muted-foreground sm:inline">· {g.hint}</span>
                  </h2>
                  <ul>
                    {items.map((r) => (
                      <Fragment key={r.id}>
                        <GanttRow r={r} s={s} open={open === r.id} onToggle={() => setOpen((o) => (o === r.id ? null : r.id))} />
                      </Fragment>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Draft contracts aren’t shown. Move an end date on a contract and its notice window moves with it.</p>
    </div>
  );
}
/** Quarter starts, for the 3-year scale */
const parse3 = (m: string) => ["01", "04", "07", "10"].includes(m.slice(5, 7));

function GanttRow({ r, s, open, onToggle }: { r: Row; s: ReturnType<typeof scale>; open: boolean; onToggle: () => void }) {
  const start = s.pct(r.start);
  const nb = s.pct(r.nb);
  const end = s.pct(r.end);
  const renew = r.renewEnd ? s.pct(r.renewEnd) : null;
  const ended = r.state === "ended";
  const offRight = s.raw(r.start) > 100;
  const beyond = s.raw(r.end) > 100;
  const id = `row-${r.id}`;
  return (
    <li className="border-b border-(--brand-line) last:border-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className={cn("group grid w-full grid-cols-[17rem_1fr] text-left transition-colors duration-(--duration-fast) hover:bg-muted/50", open && "bg-muted/50")}
      >
        <span className="flex min-w-0 items-center gap-2 px-5 py-3">
          <ChevronRight className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-(--duration-fast)", open && "rotate-90")} aria-hidden />
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium">{r.title}</span>
            <span className={cn("tnum block truncate text-xs", r.state === "now" ? "text-critical" : r.state === "missed" ? "text-critical" : "text-muted-foreground")}>
              {ended ? `Ended ${formatDate(r.end)}` : r.state === "missed" ? `Too late for notice · ends ${formatDate(r.end)}` : `Notice by ${formatDate(r.nb)} · ${daysLeft(r.dn).toLowerCase()}`}
            </span>
          </span>
        </span>
        <span className="relative block min-h-14" aria-hidden>
          {offRight ? (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">Starts {formatDate(r.start)} →</span>
          ) : (
            <>
              <span className={cn("absolute top-1/2 h-3 -translate-y-1/2 rounded-l-sm", ended ? fill.ended : fill.running)} style={{ left: `${start}%`, width: `${Math.max(nb - start, 0)}%` }} />
              <span
                className={cn("absolute top-1/2 h-3 -translate-y-1/2", !beyond && "rounded-r-sm", ended ? fill.ended : r.state === "missed" ? fill.missed : fill.notice)}
                style={{ left: `${nb}%`, width: `${Math.max(end - nb, 0.4)}%` }}
              />
              {renew !== null && !beyond && (
                <span className="absolute top-1/2 h-3 -translate-y-1/2 rounded-r-sm border border-l-0 border-dashed border-(--timeline-renewal)" style={{ left: `${end}%`, width: `${renew - end}%` }} />
              )}
              {r.state !== "missed" && !ended && s.raw(r.nb) >= 0 && s.raw(r.nb) <= 100 && (
                <span className={cn("absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ring-2 ring-card", r.dn <= 31 ? "bg-critical" : "bg-foreground")} style={{ left: `${nb}%` }} />
              )}
              {beyond && <span className="absolute top-1/2 right-2 -translate-y-1/2 rounded bg-card/90 px-1 text-[11px] text-muted-foreground">ends {formatDate(r.end, { year: true })} →</span>}
            </>
          )}
        </span>
      </button>
      <div id={id} hidden={!open} className="grid gap-4 border-t border-(--brand-line) bg-muted/30 px-5 py-4 sm:grid-cols-[16rem_1fr] sm:pl-11">
        <dl className="grid grid-cols-[6rem_1fr] gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Value</dt>
          <dd className="tnum">{money(r)}</dd>
          <dt className="text-muted-foreground">Runs</dt>
          <dd className="tnum">
            {formatDate(r.start)} – {formatDate(r.end)}
          </dd>
          <dt className="text-muted-foreground">Notice by</dt>
          <dd className="tnum">{formatDate(r.nb)}</dd>
        </dl>
        <div className="flex flex-col items-start gap-3">
          {r.autoRenew ? (
            <Badge variant="warning">
              <RefreshCw /> Renews for {r.autoRenew.months} months unless notice is given
            </Badge>
          ) : (
            <Badge variant="outline">Ends. Decide what replaces it.</Badge>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href={`/contracts/${r.id}`}>
                Open contract <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href={`/chat?q=${encodeURIComponent(`What are our options when the ${r.title.toLowerCase()} contract ends?`)}`}>
                <MessageSquare data-icon="inline-start" /> Ask about options
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function money(r: Row) {
  if (!r.annualValue) return "Not recorded";
  return r.currency === "USD" ? `$${r.annualValue.toLocaleString("en-GB")} a year` : `${gbp(r.annualValue, { compact: true })} a year`;
}

function Legend() {
  const item = (cls: string, label: string) => (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-5 rounded-sm", cls)} />
      {label}
    </span>
  );
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {item(fill.running, "Running")}
      {item(fill.notice, "Notice window")}
      {item(fill.missed, "Missed")}
      {item("border border-dashed border-(--timeline-renewal)", "Renews if no notice")}
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rotate-45 bg-foreground" /> Notice deadline
      </span>
    </div>
  );
}
