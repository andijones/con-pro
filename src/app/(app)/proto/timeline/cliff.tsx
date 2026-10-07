"use client";
// Throwaway: /proto/timeline. Cliff: the trust's committed annual value over time, so renewal cliffs and what's at
// stake show at a glance; contracts below grouped by category, bars as thick as their value.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/contravo/primitives";
import { addMonths, monthLabel, rows, scale, todayIso, type Row } from "./shared";

const FROM = "2026-09-01";
const TO = "2030-01-01";
const W = 1000;
const H = 220;
const PAD = { l: 8, r: 8, t: 12, b: 4 };

export function Cliff() {
  const s = scale(FROM, TO);
  const live = rows.filter((r) => r.state !== "ended");
  const months = useMemo(() => {
    const out: string[] = [];
    for (let m = FROM; m < TO; m = addMonths(m, 1)) out.push(m);
    return out;
  }, []);
  const at = (m: string, withRenewals: boolean) =>
    live.reduce((sum, r) => {
      const running = r.start <= m && m <= r.end;
      const renewed = withRenewals && r.renewEnd && r.end < m && m <= r.renewEnd;
      return sum + (running || renewed ? r.value : 0);
    }, 0);
  const committed = months.map((m) => at(m, false));
  const ifRenewed = months.map((m) => at(m, true));
  const max = Math.ceil(Math.max(...ifRenewed) / 2_000_000) * 2_000_000;
  const x = (m: string) => PAD.l + (s.raw(m) / 100) * (W - PAD.l - PAD.r);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const step = (vals: number[]) => vals.map((v, i) => `${i ? "H" : "M"}${x(months[i]).toFixed(1)} ${i ? `V${y(v).toFixed(1)}` : y(v).toFixed(1)}`).join(" ") + ` H${x(TO)}`;
  const area = `${step(committed)} V${y(0)} H${x(FROM)} Z`;

  const now = at(todayIso.slice(0, 8) + "01", false);
  const in12 = at(addMonths(todayIso.slice(0, 8) + "01", 12), false);
  const ending12 = now - in12;
  // The steepest single month, for the annotation
  // Labelled with the month the contracts end in (the drop shows from the start of the next month)
  const drops = months.slice(1).map((_, i) => ({ m: months[i], d: committed[i] - committed[i + 1] })).sort((a, b) => b.d - a.d);
  const biggest = drops[0];

  const [hover, setHover] = useState<number | null>(null);
  const hi = hover ?? months.findIndex((m) => m.slice(0, 7) === todayIso.slice(0, 7));

  const cats = [...new Set(live.map((r) => r.category))].map((c) => ({ c, items: live.filter((r) => r.category === c).sort((a, b) => a.end.localeCompare(b.end)) }));
  const maxV = Math.max(...live.map((r) => r.value), 1);

  return (
    <div>
      <PageHeader title="Timeline">
        What the trust is committed to spend each year, and when it falls away. Every drop is a contract ending: a decision about what replaces it has to come first.
      </PageHeader>

      <section aria-labelledby="cliff-h" className="mt-6 rounded-xl bg-card p-5 shadow-card">
        <h2 id="cliff-h" className="sr-only">
          Committed annual value over time
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <Stat label="Committed today" value={`${gbp(now, { compact: true })} a year`} />
          <Stat label="Ends in the next 12 months" value={`${gbp(ending12, { compact: true })} a year`} tone={ending12 > 0 ? "warning" : undefined} />
          <Stat label="Biggest single drop" value={`−${gbp(biggest.d, { compact: true })} in ${monthLabel(biggest.m, { month: "short", year: "numeric" })}`} />
        </dl>

        <div className="relative mt-6">
          {/* Readout for the month under the pointer (today by default) */}
          <p className="tnum mb-2 text-sm" aria-live="polite">
            <span className="font-medium">{monthLabel(months[hi], { month: "long", year: "numeric" })}</span>
            <span className="text-muted-foreground">
              {" "}
              · {gbp(committed[hi], { compact: true })} a year committed
              {ifRenewed[hi] > committed[hi] && <> · {gbp(ifRenewed[hi], { compact: true })} if every automatic renewal goes ahead</>}
            </span>
          </p>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="h-56 w-full"
            role="img"
            aria-label={`Committed annual value falls from ${gbp(now, { compact: true })} today to ${gbp(in12, { compact: true })} in 12 months. The steepest drop is ${monthLabel(biggest.m, { month: "long", year: "numeric" })}.`}
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const f = (e.clientX - r.left) / r.width;
              setHover(Math.max(0, Math.min(months.length - 1, Math.floor(f * months.length))));
            }}
          >
            {[0.25, 0.5, 0.75, 1].map((t) => (
              <line key={t} x1={PAD.l} x2={W - PAD.r} y1={y(max * t)} y2={y(max * t)} stroke="var(--brand-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            ))}
            <path d={area} fill="color-mix(in oklab, var(--brand-iris) 16%, transparent)" />
            <path d={step(ifRenewed)} fill="none" stroke="var(--timeline-renewal)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <path d={step(committed)} fill="none" stroke="var(--brand-violet)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <line x1={x(todayIso)} x2={x(todayIso)} y1={PAD.t} y2={H} stroke="var(--foreground)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            {hover !== null && <line x1={x(months[hover])} x2={x(months[hover])} y1={PAD.t} y2={H} stroke="var(--muted-foreground)" strokeWidth="1" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />}
          </svg>
          {/* Y labels and the axis, in HTML so the text isn't stretched */}
          <div className="pointer-events-none absolute top-8 right-0 left-0 h-56" aria-hidden>
            {[0.5].map((t) => (
              <span key={t} className="tnum absolute left-1 -translate-y-full text-[11px] text-muted-foreground" style={{ top: `${(y(max * t) / H) * 100}%` }}>
                {gbp(max * t, { compact: true })}
              </span>
            ))}
            <span className="absolute -top-0.5 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[11px] font-medium text-background" style={{ left: `${(x(todayIso) / W) * 100}%` }}>
              Today
            </span>
          </div>
          <div className="relative mt-1 h-5 text-[11px] text-muted-foreground" aria-hidden>
            {months
              .filter((m) => ["01", "04", "07", "10"].includes(m.slice(5, 7)))
              .map((m) => (
                <span key={m} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${(x(m) / W) * 100}%` }}>
                  {m.endsWith("01-01") ? <span className="font-medium text-foreground">{m.slice(0, 4)}</span> : monthLabel(m)}
                </span>
              ))}
          </div>
          {/* Notice deadlines along the bottom: the decisions that come before each drop */}
          <Deadlines items={live.filter((r) => r.state !== "missed" && r.nb >= FROM && r.nb < TO)} at={(iso) => (x(iso) / W) * 100} />
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 bg-(--brand-violet)" /> Committed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0 w-5 border-t-2 border-dashed border-(--timeline-renewal)" /> If automatic renewals go ahead
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rotate-45 bg-foreground" /> Notice deadline
          </span>
        </p>
      </section>

      {/* Portfolio: by category, bar thickness by value, on the same time scale */}
      <section aria-labelledby="port-h" className="mt-10">
        <h2 id="port-h" className="section-title mb-3">
          By category
        </h2>
        <div className="overflow-x-auto rounded-xl bg-card shadow-card">
          <div className="min-w-[760px]">
            {cats.map(({ c, items }) => (
              <div key={c} className="border-b border-(--brand-line) last:border-0">
                <p className="flex items-baseline justify-between bg-muted/50 px-5 py-1.5 text-xs font-medium">
                  {c}
                  <span className="tnum font-normal text-muted-foreground">{gbp(items.reduce((t, r) => t + r.value, 0), { compact: true })} a year</span>
                </p>
                <ul>
                  {items.map((r) => (
                    <PortRow key={r.id} r={r} x={(iso) => (x(iso) / W) * 100} thick={4 + (r.value / maxV) * 14} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function PortRow({ r, x, thick }: { r: Row; x: (iso: string) => number; thick: number }) {
  const clip = (iso: string) => Math.max(0, Math.min(100, x(iso < FROM ? FROM : iso > TO ? TO : iso)));
  const s = clip(r.start);
  const n = clip(r.nb);
  const e = clip(r.end);
  return (
    <li>
      <Link href={`/contracts/${r.id}`} className="group grid grid-cols-[15rem_1fr] items-center gap-4 px-5 py-2 transition-colors duration-(--duration-fast) hover:bg-muted/50">
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium group-hover:text-primary">{r.title}</span>
          <span className="tnum block text-xs text-muted-foreground">
            {r.value ? `${gbp(r.value, { compact: true })} a year` : "Value not recorded"} · ends {formatDate(r.end, { year: true })}
          </span>
        </span>
        <span className="relative block h-6" aria-hidden>
          <span className="absolute top-1/2 -translate-y-1/2 rounded-l-sm bg-(--timeline-running)" style={{ left: `${s}%`, width: `${Math.max(n - s, 0)}%`, height: thick }} />
          <span
            className={cn("absolute top-1/2 -translate-y-1/2 rounded-r-sm", r.state === "missed" ? "bg-(--timeline-missed)" : "bg-(--timeline-notice)")}
            style={{ left: `${n}%`, width: `${Math.max(e - n, 0.4)}%`, height: thick }}
          />
        </span>
      </Link>
    </li>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("tnum mt-1 text-xl tracking-[-0.01em]", tone === "warning" && "text-warning")}>{value}</dd>
    </div>
  );
}

/** Deadline markers; ones too close to tap separately stack into a second lane (24px targets never overlap) */
function Deadlines({ items, at }: { items: Row[]; at: (iso: string) => number }) {
  const ref = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(1000);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const gap = (28 / width) * 100;
  const lanes: number[] = [];
  const placed = [...items]
    .sort((a, b) => a.nb.localeCompare(b.nb))
    .map((r) => {
      const left = at(r.nb);
      let lane = lanes.findIndex((end) => left - end >= gap);
      if (lane === -1) lane = lanes.push(-Infinity) - 1;
      lanes[lane] = left;
      return { r, left, lane };
    });
  return (
    <ul ref={ref} className="relative mt-2 border-t border-(--brand-line)" style={{ height: Math.max(1, lanes.length) * 28 }} aria-label="Notice deadlines">
      {placed.map(({ r, left, lane }) => (
        <li key={r.id} className="absolute -translate-x-1/2" style={{ left: `${left}%`, top: lane * 28 }}>
          <Link
            href={`/contracts/${r.id}`}
            aria-label={`${r.title}: notice by ${formatDate(r.nb)}, ${gbp(r.value, { compact: true })} a year`}
            title={`${r.title} · notice by ${formatDate(r.nb)} · ${gbp(r.value, { compact: true })} a year`}
            className="grid size-6 place-items-center"
          >
            <span className={cn("size-2.5 rotate-45", r.dn <= 31 ? "bg-critical" : r.dn <= 90 ? "bg-(--timeline-notice)" : "bg-foreground")} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

