import Link from "next/link";
import { cn as clsx } from "@/lib/utils";
import { Plus } from "lucide-react";
import { foiRequests } from "@/lib/data";
import { daysUntil, formatDate } from "@/lib/dates";
import { foiDue, foiElapsed } from "@/lib/derive";
import { PageHeader, PersonAvatar } from "@/components/contravo/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const metadata = { title: "FOI requests" };

const statusVariant = {
  New: "secondary",
  Searching: "outline",
  "Confirm scope": "warning",
  "Draft ready": "secondary",
  "With reviewer": "outline",
  Sent: "success",
} as const;

export default function FoiPage() {
  const rows = foiRequests
    .map((f) => ({ ...f, due: foiDue(f), elapsed: foiElapsed(f) }))
    .sort((a, b) => a.due.localeCompare(b.due));

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Freedom of Information"
        title="FOI requests"
        actions={
          <Button asChild>
            <Link href="/chat?tab=foi">
              <Plus data-icon="inline-start" /> New request
            </Link>
          </Button>
        }
      >
        Paste a request in and Contravo finds the contracts and drafts a reply. An officer reviews every draft, and nothing is sent
        automatically.
      </PageHeader>

      <ul className="mt-8 flex flex-col gap-3">
        {rows.map((f) => {
          const left = daysUntil(f.due);
          const tone = left <= 2 ? "critical" : left <= 7 ? "warning" : "iris";
          return (
            <li key={f.id}>
              <Link
                href={`/foi/${f.id}`}
                className="group grid items-center gap-x-6 gap-y-3 rounded-lg border border-border bg-card p-5 transition-colors hover:border-input sm:grid-cols-[180px_1fr_auto]"
              >
                <div>
                  <p
                    className={clsx(
                      "tnum text-[2rem] leading-none tracking-[-0.03em]",
                      tone === "critical" ? "text-critical" : tone === "warning" ? "text-warning" : "text-foreground",
                    )}
                  >
                    {left <= 0 ? "Today" : left}
                    {left > 0 && <span className="ml-1 text-sm tracking-normal">{left === 1 ? "day" : "days"}</span>}
                  </p>
                  {/* 20 working-day clock: one segment per day */}
                  <div className="mt-2.5 flex gap-[2px]" aria-label={`Working day ${f.elapsed} of 20`}>
                    {Array.from({ length: 20 }).map((_, i) => (
                      <span
                        key={i}
                        className={clsx(
                          "h-1.5 flex-1 rounded-[1px]",
                          i < f.elapsed
                            ? tone === "critical"
                              ? "bg-critical"
                              : tone === "warning"
                                ? "bg-warning"
                                : "bg-ring"
                            : "bg-muted ring-1 ring-border ring-inset",
                        )}
                      />
                    ))}
                  </div>
                  <p className="tnum mt-1.5 text-xs text-muted-foreground">
                    Day {f.elapsed} of 20 · due {formatDate(f.due, { year: false })}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="tnum text-xs text-muted-foreground">
                    {f.ref} · {f.requester} · received {formatDate(f.received, { year: false })}
                  </p>
                  <p className="mt-1 text-lg font-medium tracking-[-0.01em] group-hover:text-primary">{f.subject}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">“{f.text}”</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusVariant[f.status]}>{f.status}</Badge>
                  <PersonAvatar id={f.assignee} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
