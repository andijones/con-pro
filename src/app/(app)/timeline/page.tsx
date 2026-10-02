import Link from "next/link";
import { cn as clsx } from "@/lib/utils";
import { contracts } from "@/lib/data";
import { TODAY, daysUntil, formatDate, parse } from "@/lib/dates";
import { noticeBy } from "@/lib/derive";
import { PageHeader } from "@/components/contravo/primitives";

export const metadata = { title: "Timeline" };

const START = parse("2026-09-01");
const END = parse("2028-12-31");
const span = END.getTime() - START.getTime();
const pct = (d: Date) => Math.max(0, Math.min(100, ((d.getTime() - START.getTime()) / span) * 100));

export default function TimelinePage() {
  const rows = contracts
    .filter((c) => c.status !== "Draft")
    .map((c) => ({ c, nb: noticeBy(c) }))
    .sort((a, b) => a.nb.localeCompare(b.nb));

  const quarters: { label: string; left: number; year?: string }[] = [];
  for (let y = 2026; y <= 2028; y++) {
    for (let q = 0; q < 4; q++) {
      const d = new Date(Date.UTC(y, q * 3, 1));
      if (d < START || d > END) continue;
      quarters.push({ label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }), left: pct(d), year: q === 0 ? String(y) : undefined });
    }
  }
  const today = pct(TODAY);

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader eyebrow="Plan" title="Timeline">
        Every contract from now to the end of 2028. The shaded part of each bar is the notice window: once a contract enters it,
        the trust can no longer give notice in time.
      </PageHeader>

      <div className="mt-6 flex flex-wrap gap-5 text-xs text-muted-foreground">
        <Legend className="bg-ring/35">Running</Legend>
        <Legend className="bg-primary">Notice window</Legend>
        <Legend className="border border-dashed border-primary bg-transparent">Renews if no notice</Legend>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rotate-45 bg-critical" /> Notice deadline
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg bg-card shadow-card">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[260px_1fr] border-b border-border">
            <div className="px-5 py-3 text-xs font-medium text-muted-foreground">Contract</div>
            <div className="relative h-11">
              {quarters.map((q) => (
                <span key={q.left} className="absolute top-0 h-full border-l border-border pl-1.5 pt-2 text-[11px] text-muted-foreground" style={{ left: `${q.left}%` }}>
                  {q.year && <span className="block font-medium text-foreground">{q.year}</span>}
                  {q.label}
                </span>
              ))}
            </div>
          </div>

          <ul className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 left-[260px]" aria-hidden>
              {quarters.map((q) => (
                <span key={q.left} className="absolute inset-y-0 border-l border-border/70" style={{ left: `${q.left}%` }} />
              ))}
              <span className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${today}%` }} />
            </div>

            {rows.map(({ c, nb }) => {
              const s = pct(parse(c.start));
              const e = pct(parse(c.end));
              const n = pct(parse(nb));
              const renewEnd = c.autoRenew
                ? pct(new Date(parse(c.end).getTime() + c.autoRenew.months * 30.4 * 86_400_000))
                : null;
              const dn = daysUntil(nb);
              const missed = dn < 0;
              return (
                <li key={c.id} className="group grid grid-cols-[260px_1fr] border-b border-border last:border-0 hover:bg-muted/50">
                  <Link href={`/contracts/${c.id}`} className="min-w-0 px-5 py-3">
                    <span className="block truncate text-[13px] font-medium group-hover:text-primary">{c.title}</span>
                    <span className="tnum block truncate text-xs text-muted-foreground">
                      {missed ? `Notice window passed · ends ${formatDate(c.end)}` : `Notice by ${formatDate(nb)}`}
                    </span>
                  </Link>
                  <div className="relative h-full min-h-14">
                    <div className="absolute top-1/2 h-3 -translate-y-1/2 rounded-l-sm bg-ring/35" style={{ left: `${s}%`, width: `${n - s}%` }} />
                    <div
                      className="absolute top-1/2 h-3 -translate-y-1/2 rounded-r-sm bg-primary"
                      style={{ left: `${n}%`, width: `${Math.max(e - n, 0.4)}%` }}
                      title={`Notice window: ${formatDate(nb)} – ${formatDate(c.end)}`}
                    />
                    {renewEnd !== null && (
                      <div
                        className="absolute top-1/2 h-3 -translate-y-1/2 rounded-r-sm border border-l-0 border-dashed border-primary"
                        style={{ left: `${e}%`, width: `${renewEnd - e}%` }}
                        title={`Renews for ${c.autoRenew!.months} months if no notice`}
                      />
                    )}
                    {!missed && (
                      <span
                        className={clsx(
                          "absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 ring-2 ring-white",
                          dn <= 31 ? "bg-critical" : "bg-foreground",
                        )}
                        style={{ left: `${n}%` }}
                        title={`Notice by ${formatDate(nb)}`}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Draft contracts aren’t shown. Move an end date on a contract and its notice window moves with it.</p>
    </div>
  );
}

function Legend({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-2.5 w-5 rounded-sm", className)} />
      {children}
    </span>
  );
}
