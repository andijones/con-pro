import Link from "next/link";
import { ArrowUpRight, Eye, MessageSquare } from "lucide-react";
import { contractStatuses, contracts, currentUser, decisions, foiRequests, workspace } from "@/lib/data";
import { daysUntil, formatDate, gbp } from "@/lib/dates";
import { foiDue, foiElapsed } from "@/lib/derive";
import { DecisionList } from "@/components/contravo/decision-list";
import { Runway } from "@/components/contravo/runway";
import { ExtractionBadge, Stat, StatusBadge } from "@/components/contravo/primitives";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Home" };

export default function Home() {
  const sorted = [...decisions].sort((a, b) => a.due.localeCompare(b.due));
  const week = sorted.filter((d) => daysUntil(d.due) <= 7);
  const month = sorted.filter((d) => daysUntil(d.due) > 7 && daysUntil(d.due) <= 31);
  const later = sorted.filter((d) => daysUntil(d.due) > 31);

  const recoverable = decisions.filter((d) => d.kind === "money").reduce((s, d) => s + (d.impact?.amount ?? 0), 0);
  const committedIfIgnored = decisions
    .filter((d) => d.kind === "notice" && daysUntil(d.due) <= 31)
    .reduce((s, d) => s + (d.impact?.amount ?? 0), 0);

  const foi = foiRequests
    .filter((f) => f.status !== "Sent")
    .map((f) => ({ ...f, due: foiDue(f), elapsed: foiElapsed(f) }))
    .sort((a, b) => a.due.localeCompare(b.due));

  // Workspace numbers, as on the live platform's Home
  const assigned = decisions.filter((d) => d.owner === currentUser.id).length;
  const toCheck = workspace.filter((c) => c.extraction === "Ready to review").length;
  const active = contracts.filter((c) => c.status === "Active");
  const ending30 = active.filter((c) => daysUntil(c.end) >= 0 && daysUntil(c.end) <= 30).length;
  const pastEnd = active.filter((c) => daysUntil(c.end) < 0).length;
  const byStatus = contractStatuses.map((s) => ({ s, n: workspace.filter((c) => c.status === s).length }));
  const recent = [...workspace]
    .filter((c) => c.status !== "Deleted" && c.uploaded)
    .sort((a, b) => (b.uploaded ?? "").localeCompare(a.uploaded ?? ""))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          <p className="mb-2 text-[13px] font-medium text-muted-foreground">Thursday 1 October 2026</p>
          <h1 className="heading text-[2.5rem] text-balance">
            Good morning, {currentUser.name.split(" ")[0]}.{" "}
            <span className="text-muted-foreground">
              {week.length === 1 ? "One thing needs" : `${week.length} things need`} you this week.
            </span>
          </h1>
          <p className="mt-3 max-w-[60ch] text-base text-pretty text-muted-foreground">
            {month.length} more this month and {later.length} later. Everything else is being watched, and nothing else needs you yet.
          </p>

          <Card className="mt-8 gap-3 px-5 pt-5 pb-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-medium">Next 90 days</h2>
              <span className="text-xs text-muted-foreground">Number = days left</span>
            </div>
            <Runway items={sorted} />
          </Card>

          <Section title="This week" count={week.length} note="Deadlines you can’t get back">
            <DecisionList items={week} />
          </Section>
          <Section title="This month" count={month.length}>
            <DecisionList items={month} />
          </Section>
          <Section title="Later" count={later.length}>
            <DecisionList items={later} />
          </Section>

          {/* ── Workspace: what the live platform's Home shows ── */}
          <Separator className="my-12" />
          <section aria-labelledby="ws">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 id="ws" className="text-base font-medium">
                Workspace
              </h2>
              <Button variant="link" asChild className="h-auto p-0">
                <Link href="/contracts">View all contracts</Link>
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat value={assigned} label="Decisions assigned to you" />
              <Stat value={toCheck} label="With details to check" href="/contracts?view=to-check" tone={toCheck ? "warning" : undefined} />
              <Stat value={contracts.length} label="Contracts you can act on" href="/contracts" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              “Details to check” means the AI has read the document and a person still needs to accept or correct what it found.{" "}
              {workspace.length - contracts.length} deleted contracts aren’t counted.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Stat value={ending30} label="Active contracts ending within 30 days" />
              <Stat value={pastEnd} label="Active but past their end date" tone={pastEnd ? "critical" : undefined} />
            </div>

            <h3 className="mt-8 mb-3 text-sm font-medium">By status</h3>
            <div className="flex flex-wrap gap-2">
              {byStatus.map(({ s, n }) => (
                <Link
                  key={s}
                  href={`/contracts?status=${encodeURIComponent(s)}`}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:border-input hover:bg-accent/50",
                    n === 0 && "text-muted-foreground",
                  )}
                >
                  <span className="tnum font-medium">{n}</span>
                  {s}
                </Link>
              ))}
            </div>

            <h3 className="mt-8 mb-3 text-sm font-medium">Recently added</h3>
            <Card className="py-0">
              <Table scrollLabel="Recently added contracts">
                <TableBody>
                  {recent.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="py-3">
                        <Link
                          href={c.extraction === "Ready to review" ? `/contracts/${c.id}/review` : `/contracts/${c.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {c.fileName}
                        </Link>
                      </TableCell>
                      <TableCell className="tnum text-muted-foreground">{formatDate(c.uploaded!)}</TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-2">
                          <ExtractionBadge state={c.extraction} />
                          <StatusBadge status={c.status} />
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-sm">FOI response clocks</CardTitle>
              <CardDescription className="text-xs">20 working days from receipt</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-4">
                {foi.map((f) => {
                  const left = daysUntil(f.due);
                  const tone = left <= 2 ? "critical" : left <= 7 ? "warning" : "primary";
                  return (
                    <li key={f.id}>
                      <Link href={`/foi/${f.id}`} className="group block">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] font-medium group-hover:text-primary">{f.subject}</span>
                          <span
                            className={cn(
                              "tnum shrink-0 text-xs font-medium",
                              tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning" : "text-muted-foreground",
                            )}
                          >
                            {left <= 0 ? "Due today" : `Day ${f.elapsed} of 20`}
                          </span>
                        </div>
                        <Progress
                          aria-label={`${f.subject}: working day ${f.elapsed} of 20`}
                          value={Math.max((f.elapsed / 20) * 100, 3)}
                          className={cn(
                            "mt-1.5 h-1.5",
                            tone === "critical" && "[&>*]:bg-critical",
                            tone === "warning" && "[&>*]:bg-warning",
                          )}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {f.status} · due {formatDate(f.due, { year: false })}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>

          <Card className="gap-4">
            <CardHeader>
              <CardTitle className="text-sm">At stake this month</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Committed if nobody gives notice</p>
                <p className="tnum mt-0.5 text-2xl tracking-[-0.02em]">{gbp(committedIfIgnored, { compact: true })}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Money found, not yet recovered</p>
                <p className="tnum mt-0.5 text-2xl tracking-[-0.02em] text-success">{gbp(recoverable, { compact: true })}</p>
                <p className="mt-1 text-xs text-muted-foreground">Estimates. Finance confirms each one before it counts.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="flex-row items-start gap-3 bg-muted/50 px-5">
            <Eye className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-[13px] font-medium">Watching quietly</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                All {contracts.length} contracts were checked at 06:00 today. You only hear about a contract when it needs a decision.
              </p>
              <Link href="/contracts" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Choose what interrupts you <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </div>
          </Card>

          <Card className="flex-row items-start gap-3 px-5">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-[13px] font-medium">Ask a question</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Ask about the contracts in this workspace and get an answer with its sources.
              </p>
              <Link href="/chat" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                Start a conversation <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, count, note, children }: { title: string; count: number; note?: string; children: React.ReactNode }) {
  if (!count) return null;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-base font-medium">{title}</h2>
        <span className="tnum text-sm text-muted-foreground">{count}</span>
        {note && <span className="ml-auto text-xs text-muted-foreground">{note}</span>}
      </div>
      {children}
    </section>
  );
}
