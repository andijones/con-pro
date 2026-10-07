"use client";

/**
 * Mini month calendar for the Home rail. Dots mark what falls on each day, with a shape per kind as well as a
 * colour (WCAG 1.4.1). Only days with events are buttons; each opens its events in a popover.
 * Decision record: docs/decisions/home.md
 */
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TODAY, daysLeft, daysUntil, formatDate } from "@/lib/dates";
import { byDate, dayLabel, events, kinds, monthGrid, monthLabel, type CalendarEvent as Ev, type Kind } from "@/lib/calendar-events";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function Dot({ kind, className }: { kind: Kind; className?: string }) {
  const base = "inline-block shrink-0";
  if (kind === "notice") return <span aria-hidden className={cn(base, "size-1.5 rounded-full bg-(--timeline-notice)", className)} />;
  if (kind === "ends") return <span aria-hidden className={cn(base, "size-1.5 rounded-full ring-1 ring-(--brand-slate) ring-inset", className)} />;
  if (kind === "money") return <span aria-hidden className={cn(base, "size-1.5 rounded-[1px] bg-success", className)} />;
  return <span aria-hidden className={cn(base, "size-1.5 rotate-45 rounded-[1px] bg-primary", className)} />;
}

const today = TODAY.toISOString().slice(0, 10);
const ALL: Kind[] = ["notice", "money", "foi", "ends"];

function useMonth() {
  const [ym, setYm] = useState({ y: TODAY.getUTCFullYear(), m: TODAY.getUTCMonth() });
  const step = (n: number) => setYm(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));
  return { ...ym, step };
}

function Header({ y, m, step, count }: { y: number; m: number; step: (n: number) => void; count: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-medium">
        {monthLabel(y, m)}
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {count} {count === 1 ? "date" : "dates"}
        </span>
      </h2>
      <div className="flex gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="Previous month" onClick={() => step(-1)}>
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Next month" onClick={() => step(1)}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

const describe = (iso: string, evs: Ev[]) => `${dayLabel(iso)}: ${evs.map((e) => `${kinds[e.kind].label}, ${e.context}`).join("; ")}`;

/** Monday-first month grid. Only days with events are buttons, so the grid isn't 30 tab stops. */
function Grid({
  y,
  m,
  show = ALL,
  selected,
  onSelect,
  tint,
  renderDay,
}: {
  y: number;
  m: number;
  show?: Kind[];
  selected?: string | null;
  onSelect?: (iso: string) => void;
  tint?: boolean;
  renderDay?: (iso: string, evs: Ev[], cell: React.ReactNode) => React.ReactNode;
}) {
  const cells = monthGrid(y, m);
  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 text-center text-micro text-muted-foreground" aria-hidden>
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-y-0.5" aria-label={monthLabel(y, m)}>
        {cells.map((iso, i) => {
          if (!iso) return <li key={i} aria-hidden />;
          const evs = byDate(iso).filter((e) => show.includes(e.kind));
          const kindsHere = [...new Set(evs.map((e) => e.kind))].sort((a, b) => kinds[a].rank - kinds[b].rank);
          const n = Number(iso.slice(8));
          const isToday = iso === today;
          const past = iso < today;
          const face = (
            <>
              <span className={cn("tnum text-caption leading-none", isToday && "font-semibold", past && "text-muted-foreground")}>{n}</span>
              <span className="mt-1 flex h-1.5 items-center gap-0.5">
                {kindsHere.slice(0, 3).map((k) => (
                  <Dot key={k} kind={k} />
                ))}
              </span>
            </>
          );
          const cls = cn(
            "relative mx-auto flex size-10 flex-col items-center justify-center rounded-lg transition-colors duration-(--duration-fast)",
            isToday && "ring-1 ring-foreground/70 ring-inset",
            tint && kindsHere[0] && kinds[kindsHere[0]].tint,
          );
          if (!evs.length)
            return (
              <li key={iso} className={cls}>
                {face}
              </li>
            );
          const btn = (
            <button
              type="button"
              aria-label={describe(iso, evs)}
              aria-pressed={selected !== undefined ? selected === iso : undefined}
              onClick={() => onSelect?.(iso)}
              className={cn(cls, "hover:bg-muted", selected === iso && "bg-highlight hover:bg-highlight")}
            >
              {face}
            </button>
          );
          return <li key={iso}>{renderDay ? renderDay(iso, evs, btn) : btn}</li>;
        })}
      </ol>
    </div>
  );
}

function Key({ className }: { className?: string }) {
  return (
    <ul className={cn("grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground", className)} aria-label="Key">
      {ALL.map((k) => (
        <li key={k} className="flex min-w-0 items-center gap-1.5">
          <Dot kind={k} /> {kinds[k].label}
        </li>
      ))}
    </ul>
  );
}

function EventRow({ e, showDate }: { e: Ev; showDate?: boolean }) {
  const d = daysUntil(e.date);
  return (
    <li>
      <Link href={e.href} className="flex min-w-0 gap-2.5 rounded-md px-2 py-2 transition-colors duration-(--duration-fast) hover:bg-muted/60">
        <Dot kind={e.kind} className="mt-1.5" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-pretty">{e.title}</span>
          <span className="block truncate text-xs text-muted-foreground">{e.context}</span>
        </span>
        {showDate && (
          <span className={cn("tnum shrink-0 text-xs", d <= 7 ? "font-medium text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground")}>
            {formatDate(e.date, { year: false })}
          </span>
        )}
      </Link>
    </li>
  );
}

const inMonth = (y: number, m: number, show = ALL) => events.filter((e) => show.includes(e.kind) && e.date.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`));

export function MiniCalendar() {
  const { y, m, step } = useMonth();
  return (
    <section aria-label="Calendar" className="min-w-0 rounded-xl bg-card p-4 shadow-card">
      <Header y={y} m={m} step={step} count={inMonth(y, m).length} />
      <Grid
        y={y}
        m={m}
        renderDay={(iso, evs, btn) => (
          <Popover>
            <PopoverTrigger asChild>{btn}</PopoverTrigger>
            <PopoverContent align="center" className="w-72 p-2">
              <p className="px-2 pt-1 text-xs font-medium text-muted-foreground">
                {dayLabel(iso)} · {daysLeft(daysUntil(iso))}
              </p>
              <ol className="mt-1">
                {evs.map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
              </ol>
            </PopoverContent>
          </Popover>
        )}
      />
      <Key className="mt-3 border-t border-(--brand-line) pt-3" />
    </section>
  );
}

