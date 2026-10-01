import clsx from "clsx";
import type { Decision } from "@/lib/data";
import { TODAY, daysUntil, formatDate } from "@/lib/dates";

/** A 90-day strip: where the next decisions fall relative to today. */
export function Runway({ items, span = 90 }: { items: Decision[]; span?: number }) {
  const months: { label: string; pct: number }[] = [];
  const d = new Date(TODAY);
  d.setUTCDate(1);
  for (let i = 0; i < 4; i++) {
    d.setUTCMonth(d.getUTCMonth() + 1);
    const offset = Math.round((d.getTime() - TODAY.getTime()) / 86_400_000);
    if (offset <= span) months.push({ label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), pct: (offset / span) * 100 });
  }

  const inRange = items.filter((i) => daysUntil(i.due) <= span);

  return (
    <div className="relative">
      <div className="relative h-14">
        {/* week shading for the first 7 days */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 rounded-l-md bg-critical-muted/60"
          style={{ width: `${(7 / span) * 100}%` }}
          aria-hidden
        />
        <div className="pointer-events-none absolute top-1/2 right-0 left-0 h-px bg-input" aria-hidden />
        {months.map((m) => (
          <div key={m.label} className="pointer-events-none absolute inset-y-0 select-none" style={{ left: `${m.pct}%` }} aria-hidden>
            <div className="h-full w-px bg-border" />
            <span className="absolute -bottom-5 -translate-x-1/2 text-[11px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-0 left-0 select-none" aria-hidden>
          <div className="h-full w-0.5 bg-foreground" />
          <span className="absolute -bottom-5 text-[11px] font-medium">Today</span>
        </div>
        <ul>
          {inRange.map((item, i) => {
            const days = daysUntil(item.due);
            const pct = (days / span) * 100;
            return (
              <li key={item.id} className="absolute top-1/2" style={{ left: `${pct}%` }}>
                <a
                  href={`#${item.id}`}
                  aria-label={`${days} days, ${formatDate(item.due)}: ${item.title}`}
                  title={`${formatDate(item.due)}: ${item.title}`}
                  className={clsx(
                    "group absolute grid -translate-x-1/2 place-items-center",
                    i % 2 === 0 ? "-top-[27px]" : "top-[3px]",
                  )}
                >
                  <span
                    className={clsx(
                      "tnum grid h-6 min-w-6 place-items-center px-1.5 text-[11px] font-medium text-white ring-2 ring-white transition-transform duration-150 ease-out group-hover:scale-110",
                      // Shape as well as colour (WCAG 1.4.1): money = square, deadlines = round
                      item.kind === "money" ? "rounded-[3px]" : "rounded-full",
                      days <= 7 ? "bg-critical" : item.kind === "money" ? "bg-success" : "bg-primary",
                    )}
                  >
                    {days}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="h-5" />
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Key">
        <li className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-critical" aria-hidden /> Due within 7 days
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-full bg-primary" aria-hidden /> Deadline or decision
        </li>
        <li className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-[3px] bg-success" aria-hidden /> Money to recover
        </li>
      </ul>
    </div>
  );
}
