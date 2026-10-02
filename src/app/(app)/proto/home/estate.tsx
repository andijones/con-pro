"use client";
// Throwaway: /proto/home variant "Estate". Oversight for a lead: money, data health, the year ahead, the team.
import { useState } from "react";
import Link from "next/link";
import { contracts } from "@/lib/data";
import { formatDate, gbp } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PageHeader, PersonAvatar } from "@/components/contravo/primitives";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { annual, committing, foi, gaps, months, priceRises, reading, recoverable, reviewed, team, toReview } from "./shared";

const maxValue = Math.max(1, ...months.map((m) => m.value));

export function Estate() {
  const [month, setMonth] = useState<string | null>(months.find((m) => m.ending.length)?.key ?? null);
  const picked = months.find((m) => m.key === month);
  const [alerts, setAlerts] = useState({ notice: true, price: true, foi: true, digest: false });

  return (
    <div>
      <PageHeader title="Good morning, Priya">
        Your contract estate at a glance: what’s at stake, how much Contravo has read, and what falls due in the year ahead.
      </PageHeader>

      {/* Money ledger */}
      <section aria-labelledby="money-h" className="mt-8">
        <h2 id="money-h" className="sr-only">
          Money
        </h2>
        <div className="grid gap-px overflow-hidden rounded-xl bg-border shadow-card sm:grid-cols-2 lg:grid-cols-4">
          {[
            { v: annual, l: "a year across live contracts", href: "/contracts" },
            { v: committing, l: "commits this month unless someone gives notice", href: "/timeline", tone: "text-warning" },
            { v: priceRises, l: "in price rises you can still object to", href: "/contracts/path-reagents", tone: "text-critical" },
            { v: recoverable, l: "found that may be recoverable", href: "/reports", tone: "text-success" },
          ].map((m) => (
            <Link key={m.l} href={m.href} className="group bg-card p-5 transition-colors duration-(--duration-fast) hover:bg-muted/50">
              <span className={cn("tnum block text-3xl", m.tone)}>{gbp(m.v, { compact: true })}</span>
              <span className="mt-1 block text-sm text-muted-foreground group-hover:text-foreground">{m.l}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Year ahead */}
        <Card className="gap-4 px-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-medium">The year ahead</h2>
            <span className="text-xs text-muted-foreground">Contracts ending each month · bar height is annual value</span>
          </div>
          <div className="grid grid-cols-12 gap-1" role="group" aria-label="Months">
            {months.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={month === m.key}
                aria-label={`${m.label}${m.year ? ` ${m.year}` : ""}: ${m.ending.length} ending, ${gbp(m.value, { compact: true })} a year`}
                onClick={() => setMonth(m.key)}
                className={cn(
                  "flex h-24 flex-col justify-end rounded-md p-1 text-center transition-colors duration-(--duration-fast)",
                  month === m.key ? "bg-highlight" : "hover:bg-muted",
                )}
              >
                <span
                  className={cn("mx-auto w-full rounded-sm", m.ending.length ? "bg-primary" : "bg-border")}
                  style={{ height: `${m.ending.length ? 8 + (m.value / maxValue) * 48 : 4}px` }}
                  aria-hidden
                />
                <span className="tnum mt-1 text-[11px] font-medium">{m.value ? gbp(m.value, { compact: true }) : ""}</span>
                <span className="text-[11px] text-muted-foreground">{m.label}</span>
              </button>
            ))}
          </div>
          <div aria-live="polite" className="min-h-24">
            {picked && picked.ending.length ? (
              <ul className="flex flex-col divide-y">
                {picked.ending.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <Link href={`/contracts/${c.id}`} className="min-w-0 truncate font-medium underline-offset-4 hover:underline">
                      {c.title}
                    </Link>
                    <span className="tnum shrink-0 text-muted-foreground">
                      ends {formatDate(c.end)}
                      {c.autoRenew ? " · renews if no notice" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-2 text-sm text-muted-foreground">Nothing ends {picked ? `in ${picked.label}` : "this month"}.</p>
            )}
          </div>
        </Card>

        <DataHealth />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Team */}
        <Card className="gap-0 py-0">
          <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
            <h2 className="font-medium">Who has what</h2>
            <Link href="/audit" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
              See the trail
            </Link>
          </div>
          <Table scrollLabel="Team workload">
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="pl-5">Person</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">This week</TableHead>
                <TableHead className="pr-5 text-right">FOI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((r) => (
                <TableRow key={r.p.id}>
                  <TableCell className="pl-5">
                    <span className="flex items-center gap-2">
                      <PersonAvatar id={r.p.id} className="size-6" decorative />
                      {r.p.name}
                      <span className="hidden text-xs text-muted-foreground sm:inline">{r.p.role}</span>
                    </span>
                  </TableCell>
                  <TableCell className="tnum text-right">{r.open}</TableCell>
                  <TableCell className={cn("tnum text-right", r.soon && "font-medium text-critical")}>{r.soon || "–"}</TableCell>
                  <TableCell className="tnum pr-5 text-right">{foi.filter((v) => v.owner.id === r.p.id).length || "–"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Alerts */}
        <Card className="gap-4 px-5">
          <div>
            <h2 className="font-medium">What interrupts you</h2>
            <p className="mt-1 text-sm text-muted-foreground">Quiet by default. Choose what earns an email.</p>
          </div>
          {(
            [
              ["notice", "Notice deadlines, 30 and 7 days before"],
              ["price", "Price rises I can object to"],
              ["foi", "FOI requests falling behind pace"],
              ["digest", "A Monday summary of the week"],
            ] as const
          ).map(([k, l]) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <Label htmlFor={`alert-${k}`} className="font-normal">
                {l}
              </Label>
              <Switch id={`alert-${k}`} checked={alerts[k]} onCheckedChange={(v) => setAlerts((a) => ({ ...a, [k]: v }))} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/** "How much Contravo knows": read and checked, and what's missing. Shared with the Queue + health concept. */
export function DataHealth({ className }: { className?: string }) {
  const pct = Math.round((reviewed / contracts.length) * 100);
  return (
  <Card className={cn("gap-4 px-5", className)}>
    <div>
      <h2 className="font-medium">How much Contravo knows</h2>
      <p className="mt-1 text-sm text-muted-foreground">Answers are only as good as what’s been read and checked.</p>
    </div>
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>Read and checked by a person</span>
        <span className="tnum font-medium">
          {reviewed} of {contracts.length}
        </span>
      </div>
      <Progress value={pct} className="mt-2" aria-label={`${pct}% read and checked`} />
    </div>
    <ul className="flex flex-col gap-2 text-sm">
      {[
        { n: toReview.length, l: "ready to check", href: toReview[0] ? `/contracts/${toReview[0].id}/review` : "/contracts", badge: "default" as const },
        { n: reading.length, l: "being read now", href: "/contracts", badge: "secondary" as const },
        { n: gaps.noValue, l: "with no value recorded", href: "/contracts", badge: "warning" as const },
        { n: gaps.noSupplier, l: "with no supplier recorded", href: "/contracts", badge: "warning" as const },
        { n: gaps.partial, l: "with pages missing", href: "/contracts", badge: "warning" as const },
      ].map((r) => (
        <li key={r.l}>
          <Link href={r.href} className="flex items-center gap-2 rounded-md py-1 underline-offset-4 hover:underline">
            <Badge variant={r.badge} className="tnum min-w-7 justify-center">
              {r.n}
            </Badge>
            {r.l}
          </Link>
        </li>
      ))}
    </ul>
  </Card>
  );
}
