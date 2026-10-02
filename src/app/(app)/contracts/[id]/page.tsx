import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ChevronLeft, ListChecks, MessageSquare, Pencil, RefreshCw } from "lucide-react";
import { audit, getContract, people, workspace } from "@/lib/data";
import { daysUntil, formatDate, gbp } from "@/lib/dates";
import { decisionsFor, nextDeadline, noticeBy } from "@/lib/derive";
import { ContractReader } from "@/components/contravo/contract-reader";
import { DecisionList } from "@/components/contravo/decision-list";
import { Countdown, ExtractionBadge, Person, StatusBadge } from "@/components/contravo/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export function generateStaticParams() {
  return workspace.map((c) => ({ id: c.id }));
}

export async function generateMetadata(props: PageProps<"/contracts/[id]">) {
  const { id } = await props.params;
  return { title: getContract(id)?.title ?? "Contract" };
}

export default async function ContractPage(props: PageProps<"/contracts/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const c = getContract(id);
  if (!c) notFound();

  const clause = typeof sp.clause === "string" ? sp.clause : undefined;
  const open = decisionsFor(c.id).sort((a, b) => a.due.localeCompare(b.due));
  const next = nextDeadline(c);
  const nb = noticeBy(c);
  const live = c.extraction === "Reviewed" && ["Active", "Under review", "Legal review", "Draft"].includes(c.status);
  const history = audit.filter((a) => a.href?.startsWith(`/contracts/${c.id}`)).slice(0, 4);
  const money = (n: number | null) => (n == null ? null : c.currency === "USD" ? `$${n.toLocaleString("en-GB")}` : gbp(n));
  const months = Math.round(c.notice / 30);

  return (
    <div className="mx-auto max-w-[1180px]">
      <Button variant="link" asChild className="mb-3 h-auto px-0 text-muted-foreground">
        <Link href="/contracts">
          <ChevronLeft data-icon="inline-start" /> Contracts
        </Link>
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            <StatusBadge status={c.status} />
            <ExtractionBadge state={c.extraction} />
            <span>{c.category}</span>
            {c.businessUnit && (
              <>
                <span aria-hidden>·</span>
                <span>{c.businessUnit}</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span>{c.route}</span>
          </div>
          <h1 className="heading text-[2.25rem] text-balance">{c.title}</h1>
          <p className="mt-1 text-base text-muted-foreground">
            {c.supplier ?? <span className="text-warning">No counterparty recorded</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/contracts/${c.id}/review`}>
              <ListChecks data-icon="inline-start" /> Review extraction
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/contracts/${c.id}/details`}>
              <Pencil data-icon="inline-start" /> Edit details
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/chat?q=${encodeURIComponent(`Can we end the ${c.title.toLowerCase()} contract early?`)}`}>
              <MessageSquare data-icon="inline-start" /> Ask about this contract
            </Link>
          </Button>
        </div>
      </header>

      {c.extraction === "Ready to review" && (
        <Alert className="mt-6">
          <ListChecks />
          <AlertTitle>The AI has read this contract. Check what it found before it goes live.</AlertTitle>
          <AlertDescription>
            <Link href={`/contracts/${c.id}/review`} className="font-medium text-primary underline underline-offset-4">
              Review what the AI read
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Key facts: the deadline comes first */}
      <Card className="mt-6 grid gap-0 divide-border py-0 sm:grid-cols-2 sm:divide-x lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="p-5">
          <p className="mb-2 text-xs text-muted-foreground">{live ? next.label : "Next date"}</p>
          {live ? <Countdown date={next.date} /> : <p className="text-2xl text-muted-foreground">—</p>}
          {live && c.autoRenew && daysUntil(nb) >= 0 && (
            <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <RefreshCw className="size-3" aria-hidden /> Renews for {c.autoRenew.months} months if no notice
            </p>
          )}
        </div>
        <Fact label="Annual value" value={money(c.annualValue) ?? "Not held"} muted={!c.annualValue} />
        <Fact label="Total value" value={money(c.totalValue) ?? "Not held"} muted={!c.totalValue} />
        <div className="p-5">
          <p className="mb-2 text-xs text-muted-foreground">Term</p>
          <p className="tnum text-[15px]">
            {formatDate(c.start)} – {formatDate(c.end)}
          </p>
          <p className="tnum mt-1 text-xs text-muted-foreground">
            {months} {months === 1 ? "month’s" : "months’"} notice
            {c.reviewDate && ` · review ${formatDate(c.reviewDate, { year: false })}`}
          </p>
          <div className="mt-3">
            <Person id={c.owner} />
          </div>
        </div>
      </Card>

      {c.flags?.length ? (
        <Alert className="mt-4 border-warning/30 bg-warning-muted text-warning">
          <AlertTriangle />
          <AlertTitle>Check before you rely on these figures</AlertTitle>
          <AlertDescription className="text-foreground/80">
            <ul className="list-disc pl-4">
              {c.flags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {open.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-medium">
            Needs a decision <span className="tnum font-normal text-muted-foreground">{open.length}</span>
          </h2>
          <DecisionList items={open} />
        </section>
      )}

      <section className="mt-10">
        <ContractReader key={clause ?? "default"} clauses={c.clauses} initial={clause} title={c.title} pages={c.pages} />
      </section>

      {history.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-base font-medium">Who has looked at this</h2>
          <Card className="py-0">
            <Table scrollLabel="Who has looked at this contract">
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.at}>
                    <TableCell className="py-3 whitespace-normal">
                      <span className="font-medium">{people[h.who]?.name ?? "Contravo"}</span>{" "}
                      <span className="text-muted-foreground">{h.what}</span> {h.target}
                    </TableCell>
                    <TableCell className="tnum text-right text-xs text-muted-foreground">
                      {new Date(h.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      )}
    </div>
  );
}

function Fact({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="p-5">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <p className={`tnum text-2xl tracking-[-0.02em] ${muted ? "text-muted-foreground" : ""}`}>{value}</p>
    </div>
  );
}
