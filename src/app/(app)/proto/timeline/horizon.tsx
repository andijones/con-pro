"use client";
// Throwaway: /proto/timeline. Horizon: when decisions land, month by month, and how much money each month carries.
import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { daysLeft, formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/contravo/primitives";
import { addMonths, monthLabel, rows, todayIso, type Row } from "./shared";

const reduced = () => typeof window !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Horizon() {
  // The next 12 months by the month the notice deadline falls in, plus missed and later
  const months = Array.from({ length: 12 }, (_, i) => addMonths(`${todayIso.slice(0, 7)}-01`, i).slice(0, 7));
  const live = rows.filter((r) => r.state !== "ended");
  const missed = live.filter((r) => r.state === "missed");
  const byMonth = months.map((m) => ({ m, items: live.filter((r) => r.state !== "missed" && r.nb.slice(0, 7) === m) }));
  const later = live.filter((r) => r.state !== "missed" && r.nb.slice(0, 7) > months.at(-1)!);
  const max = Math.max(...byMonth.map((b) => b.items.reduce((s, r) => s + r.value, 0)), 1);
  const total12 = byMonth.reduce((s, b) => s + b.items.reduce((t, r) => t + r.value, 0), 0);
  const count12 = byMonth.reduce((s, b) => s + b.items.length, 0);

  const go = (m: string) => document.getElementById(`m-${m}`)?.scrollIntoView({ block: "start", behavior: reduced() ? "auto" : "smooth" });

  return (
    <div>
      <PageHeader title="Timeline">
        When each decision falls due. A contract lands in the month its notice deadline falls: miss it, and it renews or ends without a choice.
      </PageHeader>

      {/* The year at a glance: money whose decision falls due each month */}
      <section aria-labelledby="year-h" className="mt-6 rounded-xl bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="year-h" className="section-title">
            The next 12 months
          </h2>
          <p className="text-sm text-muted-foreground">
            <span className="tnum font-medium text-foreground">{count12}</span> decisions on <span className="tnum font-medium text-foreground">{gbp(total12, { compact: true })}</span> a year of
            contracts
          </p>
        </div>
        <ol className="mt-5 grid grid-cols-12 items-end gap-1.5 sm:gap-2" aria-label="Decisions by month">
          {byMonth.map(({ m, items }) => {
            const v = items.reduce((s, r) => s + r.value, 0);
            const h = items.length ? Math.max(10, (v / max) * 100) : 0;
            const label = monthLabel(`${m}-01`, { month: "long", year: "numeric" });
            return (
              <li key={m} className="flex flex-col items-stretch">
                <button
                  type="button"
                  onClick={() => go(m)}
                  disabled={!items.length}
                  aria-label={items.length ? `${label}: ${items.length} ${items.length === 1 ? "decision" : "decisions"}, ${gbp(v, { compact: true })} a year` : `${label}: nothing due`}
                  className="group flex h-36 flex-col justify-end rounded-md px-0.5 transition-colors duration-(--duration-fast) enabled:hover:bg-muted disabled:cursor-default"
                >
                  {items.length > 0 && <span className="tnum mb-1 text-center text-[11px] font-medium text-foreground">{gbp(v, { compact: true })}</span>}
                  <span
                    className={cn("w-full rounded-t-[3px]", items.some((r) => r.dn <= 31) ? "bg-critical" : items.some((r) => r.dn <= 90) ? "bg-(--timeline-notice)" : "bg-(--brand-iris)")}
                    style={{ height: `${h}%` }}
                  />
                  <span className="h-px w-full bg-border" />
                </button>
                <span className="mt-1.5 text-center text-[11px] text-muted-foreground" aria-hidden>
                  {monthLabel(`${m}-01`)}
                  {m.endsWith("-01") && <span className="block font-medium text-foreground">{m.slice(0, 4)}</span>}
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Key className="bg-critical">Due within a month</Key>
          <Key className="bg-(--timeline-notice)">Within 3 months</Key>
          <Key className="bg-(--brand-iris)">Later this year</Key>
        </p>
      </section>

      {/* The agenda */}
      <div className="mt-10 flex flex-col gap-10">
        {missed.length > 0 && <Month id="missed" title="Notice window already passed" tone="critical" items={missed} note="Still running. It’s too late to give notice, so plan for the end date." />}
        {byMonth
          .filter((b) => b.items.length)
          .map(({ m, items }) => (
            <Month key={m} id={m} title={monthLabel(`${m}-01`, { month: "long", year: "numeric" })} items={items} />
          ))}
        {later.length > 0 && <Month id="later" title="Later" items={later} note="Nothing to decide for over a year." />}
      </div>
    </div>
  );
}

function Month({ id, title, items, note, tone }: { id: string; title: string; items: Row[]; note?: string; tone?: "critical" }) {
  const v = items.reduce((s, r) => s + r.value, 0);
  return (
    <section id={`m-${id}`} aria-labelledby={`m-${id}-h`} className="scroll-mt-(--page-bar-offset)">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 id={`m-${id}-h`} className={cn("section-title", tone === "critical" && "text-critical")}>
          {title}
        </h2>
        <span className="tnum text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? "decision" : "decisions"} · {gbp(v, { compact: true })} a year
        </span>
        {note && <span className="w-full text-sm text-muted-foreground">{note}</span>}
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((r) => (
          <li key={r.id}>
            <Link href={`/contracts/${r.id}`} className="group flex h-full flex-col gap-2 rounded-xl bg-card p-4 shadow-card transition-shadow duration-(--duration-fast) hover:shadow-raised">
              <span className="flex items-start justify-between gap-3">
                <span className="font-medium text-pretty group-hover:text-primary">{r.title}</span>
                <span className="tnum shrink-0 text-sm text-muted-foreground">{r.value ? gbp(r.value, { compact: true }) : "–"}</span>
              </span>
              <span className="text-sm text-muted-foreground">{r.supplier ?? "Supplier not recorded"}</span>
              <span className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                {r.state === "missed" ? (
                  <Badge variant="critical">Ends {formatDate(r.end)}</Badge>
                ) : (
                  <Badge variant={r.dn <= 31 ? "critical" : r.dn <= 90 ? "warning" : "outline"} className="tnum">
                    Notice by {formatDate(r.nb, { year: false })} · {daysLeft(r.dn).toLowerCase()}
                  </Badge>
                )}
                {r.autoRenew && r.state !== "missed" && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <RefreshCw className="size-3" aria-hidden /> Renews if no notice
                  </span>
                )}
                <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover:opacity-100" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Key({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-sm", className)} />
      {children}
    </span>
  );
}
