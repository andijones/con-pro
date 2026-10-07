import Link from "next/link";
import { CircleCheck, CircleDashed, CircleAlert, ExternalLink } from "lucide-react";
import { daysUntil, daysLeft, formatDate, parse } from "@/lib/dates";
import { duties, sources, upcoming, type Due } from "@/lib/statutory";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/contravo/primitives";
import { ReportActions } from "@/components/contravo/report-actions";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Reports" };

/**
 * Reports: the publications the trust is required to make, when each is due, and the rule behind it.
 * Contravo drafts what it can from the contracts and says plainly what it needs from someone else (usually Finance).
 * Rules and sources: src/lib/statutory.ts. Decision record: docs/decisions/reports.md
 */

const toneMeta = {
  ready: { icon: CircleCheck, className: "text-success", label: "Ready" },
  needs: { icon: CircleAlert, className: "text-warning", label: "Needs input" },
  nothing: { icon: CircleDashed, className: "text-muted-foreground", label: "Nothing yet" },
} as const;

function DueRow({ item }: { item: Due }) {
  const d = item.due ? daysUntil(item.due) : null;
  const date = item.due ? parse(item.due) : null;
  const tone = toneMeta[item.tone];
  return (
    <li className="grid grid-cols-[3.25rem_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-xl bg-card p-4 shadow-card sm:grid-cols-[3.25rem_minmax(0,1fr)_auto] sm:items-center">
      {date && (
        <span className="flex flex-col items-center self-start rounded-lg bg-muted py-1.5 leading-none" aria-hidden>
          {/* A dated deadline shows day and month; a monthly one shows its month and year */}
          <span className="tnum text-lg font-medium">{item.dueLabel ? date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) : date.getUTCDate()}</span>
          <span className="mt-0.5 text-micro text-muted-foreground uppercase">
            {item.dueLabel ? date.getUTCFullYear() : date.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}
          </span>
        </span>
      )}
      <div className="min-w-0">
        <h3 className="font-medium text-pretty">
          {item.contract ? (
            <Link href={`/contracts/${item.contract.id}`} className="hover:text-primary hover:underline">
              {item.duty.title}: {item.covers}
            </Link>
          ) : (
            <>
              {item.duty.title} <span className="font-normal text-muted-foreground">· {item.covers}</span>
            </>
          )}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.duty.rule} · due {item.dueLabel ? item.dueLabel.charAt(0).toLowerCase() + item.dueLabel.slice(1) : formatDate(item.due!)}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-sm text-pretty">
          <tone.icon className={cn("mt-0.5 size-4 shrink-0", tone.className)} aria-hidden />
          <span>
            <span className="sr-only">{tone.label}: </span>
            {item.status}
          </span>
        </p>
      </div>
      <div className="col-start-2 flex flex-wrap items-center gap-3 sm:col-start-3 sm:flex-col sm:items-end">
        {d != null && !item.dueLabel && (
          <Badge variant={d <= 7 ? "critical" : d <= 31 ? "warning" : "outline"} className="tnum">
            {daysLeft(d)}
          </Badge>
        )}
        {item.tone !== "nothing" && <ReportActions title={`${item.duty.title}${item.contract ? `: ${item.covers}` : ` (${item.covers})`}`} />}
      </div>
    </li>
  );
}

export default function ReportsPage() {
  const items = upcoming();
  const soon = items.filter((i) => !i.due || daysUntil(i.due) <= 92);
  const later = items.filter((i) => i.due && daysUntil(i.due) > 92);

  return (
    <div>
      <PageHeader title="Reports">
        What the trust has to publish, when each one is due and the rule behind it. Contravo drafts what it can from your contracts and says
        what it still needs from someone else.
      </PageHeader>

      <section aria-labelledby="soon-h">
        <h2 id="soon-h" className="section-title mb-4">
          Due in the next 3 months
        </h2>
        <ol className="flex flex-col gap-3">
          {soon.map((i) => (
            <DueRow key={i.key} item={i} />
          ))}
        </ol>
      </section>

      {later.length > 0 && (
        <section aria-labelledby="later-h" className="mt-12">
          <h2 id="later-h" className="section-title mb-4">
            Later
          </h2>
          <ol className="flex flex-col gap-3">
            {later.map((i) => (
              <DueRow key={i.key} item={i} />
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="rules-h" className="mt-12">
        <h2 id="rules-h" className="section-title">
          Everything the trust publishes
        </h2>
        <p className="mt-1 mb-4 max-w-[65ch] text-sm text-pretty text-muted-foreground">
          Health care services bought under the Provider Selection Regime are outside the Procurement Act. Goods and non-clinical services,
          such as equipment, cleaning and IT, are inside it.
        </p>
        <div className="rounded-xl bg-card shadow-card">
          <Table scrollLabel="Statutory publications">
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="pl-4">Publication</TableHead>
                <TableHead>Rule</TableHead>
                <TableHead>Applies to</TableHead>
                <TableHead className="pr-4">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {duties.map((d) => (
                <TableRow key={d.id} className="align-top">
                  <TableCell className="max-w-72 min-w-56 pl-4 whitespace-normal">
                    <span className="block font-medium">{d.title}</span>
                    <span className="mt-0.5 block text-xs text-pretty text-muted-foreground">{d.contains}</span>
                  </TableCell>
                  <TableCell className="min-w-36 whitespace-normal">{d.rule}</TableCell>
                  <TableCell className="min-w-40 whitespace-normal">{d.appliesTo}</TableCell>
                  <TableCell className="min-w-48 pr-4 whitespace-normal">
                    <span className="block">{d.cadence}</span>
                    <span className="mt-0.5 block text-xs text-pretty text-muted-foreground">{d.deadline}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          <p>Checked against the guidance on 7 October 2026. Contravo isn’t legal advice: confirm anything you rely on with your procurement lead.</p>
          <ul className="mt-2 flex flex-col gap-1">
            {sources.map((s) => (
              <li key={s.href}>
                <a href={s.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline hover:text-foreground">
                  {s.label}
                  <ExternalLink className="size-3" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
