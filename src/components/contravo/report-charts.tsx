"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const valueConfig = {
  value: { label: "Annual value", color: "var(--chart-1)" },
} satisfies ChartConfig;

/** WCAG 1.1.1: every chart carries the same data as a table for screen readers. */
function SrTable({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: (string | number)[][];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={String(r[0])}>
            {r.map((c, i) =>
              i === 0 ? (
                <th key={i} scope="row">
                  {c}
                </th>
              ) : (
                <td key={i}>{c}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function ValueByCategory({
  data,
}: {
  data: { category: string; value: number }[];
}) {
  return (
    <>
      <SrTable
        caption="Annual value by category"
        head={["Category", "Annual value"]}
        rows={data.map((d) => [
          d.category,
          `£${d.value.toLocaleString("en-GB")}`,
        ])}
      />
      <ChartContainer
        config={valueConfig}
        className="aspect-auto h-64 w-full"
        aria-hidden
      >
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }} accessibilityLayer={false}>
          <CartesianGrid horizontal={false} />
          <YAxis
            dataKey="category"
            type="category"
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `£${(v / 1_000_000).toFixed(1)}m`}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                formatter={(v) => `£${Number(v).toLocaleString("en-GB")}`}
                hideIndicator
              />
            }
          />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
        </BarChart>
      </ChartContainer>
    </>
  );
}

const renewalConfig = {
  notice: { label: "Notice deadlines", color: "var(--chart-1)" },
  ends: { label: "Contracts ending", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function RenewalsByQuarter({
  data,
}: {
  data: { quarter: string; notice: number; ends: number }[];
}) {
  return (
    <>
      <SrTable
        caption="Notice deadlines and end dates by quarter"
        head={["Quarter", "Notice deadlines", "Contracts ending"]}
        rows={data.map((d) => [d.quarter, d.notice, d.ends])}
      />
      <ChartContainer
        config={renewalConfig}
        className="aspect-auto h-64 w-full"
        aria-hidden
      >
        <BarChart data={data} margin={{ left: -16, right: 8 }} accessibilityLayer={false}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="quarter" tickLine={false} axisLine={false} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="notice" fill="var(--color-notice)" radius={4} />
          <Bar dataKey="ends" fill="var(--color-ends)" radius={4} />
          <ChartLegend content={<ChartLegendContent />} />
        </BarChart>
      </ChartContainer>
    </>
  );
}
