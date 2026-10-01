import Link from "next/link";
import { FileBarChart, FileSpreadsheet, Landmark, PiggyBank, RefreshCw, ScrollText } from "lucide-react";
import { contracts, decisions } from "@/lib/data";
import { gbp, parse } from "@/lib/dates";
import { noticeBy } from "@/lib/derive";
import { PageHeader } from "@/components/contravo/primitives";
import { RenewalsByQuarter, ValueByCategory } from "@/components/contravo/report-charts";
import { ReportActions } from "@/components/contravo/report-actions";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Reports" };

const library = [
  { icon: FileSpreadsheet, title: "Contracts register", desc: "Every contract and its key fields, ready to publish or share.", format: "CSV · XLSX" },
  { icon: Landmark, title: "Transparency notices", desc: "Contract details notices under the Procurement Act 2023, drafted from the signed contract.", format: "PDF" },
  { icon: FileBarChart, title: "Spend report", desc: "Contracted annual value by category, supplier and business unit.", format: "XLSX" },
  { icon: RefreshCw, title: "Renewals and notice dates", desc: "Every notice deadline in the next 18 months, with owner.", format: "PDF · CSV" },
  { icon: PiggyBank, title: "Savings tracker", desc: "Money found (VAT, duplicates, overcharges) and what has been recovered.", format: "XLSX" },
  { icon: ScrollText, title: "Procurement pipeline", desc: "Contracts that need a route decision, with PSR or Procurement Act options.", format: "PDF" },
];

export default function ReportsPage() {
  const live = contracts.filter((c) => c.status === "Active" && c.extraction === "Reviewed");
  const counted = live.filter((c) => c.annualValue && c.currency !== "USD");
  const excluded = live.filter((c) => !c.annualValue || c.currency === "USD");

  const byCat = Object.entries(
    counted.reduce<Record<string, number>>((acc, c) => ((acc[c.category] = (acc[c.category] ?? 0) + (c.annualValue ?? 0)), acc), {}),
  )
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value);

  const quarters = ["Q4 2026", "Q1 2027", "Q2 2027", "Q3 2027", "Q4 2027", "Q1 2028"];
  const qOf = (iso: string) => {
    const d = parse(iso);
    return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
  };
  const renewals = quarters.map((q) => ({
    quarter: q,
    notice: live.filter((c) => qOf(noticeBy(c)) === q).length,
    ends: live.filter((c) => qOf(c.end) === q).length,
  }));

  const money = decisions.filter((d) => d.kind === "money" || d.kind === "price");
  const total = counted.reduce((s, c) => s + (c.annualValue ?? 0), 0);

  const suppliers = Object.values(
    counted.reduce<Record<string, { name: string; n: number; value: number }>>((acc, c) => {
      const k = c.supplier!;
      acc[k] ??= { name: k, n: 0, value: 0 };
      acc[k].n++;
      acc[k].value += c.annualValue ?? 0;
      return acc;
    }, {}),
  )
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Reports">
        Built from the contracts themselves and kept up to date. Every figure links back to the contracts it came from, and anything that
        couldn’t be counted is listed.
      </PageHeader>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Annual value by category</CardTitle>
            <CardDescription>
              <span className="tnum text-foreground">{gbp(total)}</span> a year across {counted.length} active contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ValueByCategory data={byCat} />
          </CardContent>
          {excluded.length > 0 && (
            <CardFooter className="flex-col items-start gap-1 text-xs text-muted-foreground">
              <span className="font-medium text-warning">Not counted ({excluded.length})</span>
              {excluded.map((c) => (
                <Link key={c.id} href={`/contracts/${c.id}`} className="hover:text-primary hover:underline">
                  {c.title}: {c.currency === "USD" ? "value held in US dollars" : "annual value not held"}
                </Link>
              ))}
            </CardFooter>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notice deadlines and end dates</CardTitle>
            <CardDescription>By quarter, active contracts</CardDescription>
          </CardHeader>
          <CardContent>
            <RenewalsByQuarter data={renewals} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Largest suppliers</CardTitle>
            <CardDescription>By contracted annual value</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table scrollLabel="Largest suppliers">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="pl-4">Supplier</TableHead>
                  <TableHead className="text-right">Contracts</TableHead>
                  <TableHead className="pr-4 text-right">Annual value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.name}>
                    <TableCell className="pl-4">{s.name}</TableCell>
                    <TableCell className="tnum text-right">{s.n}</TableCell>
                    <TableCell className="tnum pr-4 text-right">{gbp(s.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Money found</CardTitle>
            <CardDescription>Estimates until Finance confirms them</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {money.map((d) => (
              <Link key={d.id} href={`/#${d.id}`} className="flex items-baseline justify-between gap-4 py-2.5 text-sm first:pt-0 hover:text-primary">
                <span className="min-w-0 truncate">{d.title}</span>
                <span className="tnum shrink-0 font-medium text-success">{d.impact ? gbp(d.impact.amount) : "—"}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-12 mb-4 text-base font-medium">Report library</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {library.map((r) => (
          <Card key={r.title} size="sm">
            <CardHeader>
              <r.icon className="mb-2 size-5 text-primary" aria-hidden />
              <CardTitle>{r.title}</CardTitle>
              <CardDescription>{r.desc}</CardDescription>
              <CardAction className="text-xs text-muted-foreground">{r.format}</CardAction>
            </CardHeader>
            <CardFooter>
              <ReportActions title={r.title} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
