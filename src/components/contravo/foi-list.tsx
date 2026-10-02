/**
 * FOI requests as the next thing to do, grouped by whose move it is,
 * each with its 20-working-day clock and the target pace marked.
 * Decision record: docs/decisions/foi.md
 */
import Link from "next/link";
import { AlertTriangle, ArrowRight, Bot } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { dueText, milestones, targetDate, type FoiView } from "@/lib/foi-lifecycle";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "./primitives";

const sections: { title: string; hint: string; test: (v: FoiView) => boolean; quiet?: boolean }[] = [
  { title: "Your move", hint: "An officer needs to do something before these can go further.", test: (v) => v.owner.kind === "officer" },
  {
    title: "Waiting on someone else",
    hint: "Contravo or the reviewer has it. Nothing for you to do yet.",
    test: (v) => v.owner.kind === "contravo" || v.owner.kind === "reviewer",
    quiet: true,
  },
  { title: "Sent", hint: "Finished. The requester can ask for an internal review within 40 working days.", test: (v) => v.stage === "sent", quiet: true },
];

const paceLabel = { "on-track": "On track", behind: "Behind", overdue: "Overdue", done: "Sent" } as const;
const paceBadge = { "on-track": "success", behind: "warning", overdue: "critical", done: "secondary" } as const;
const paceText = (v: FoiView) => (v.pace === "overdue" ? "text-critical" : v.pace === "behind" ? "text-warning" : "");

export function FoiList({ requests }: { requests: FoiView[] }) {
  return (
    <>
      {sections.map((s) => {
        const items = requests.filter(s.test).sort((a, b) => a.daysLeft - b.daysLeft);
        if (!items.length) return null;
        const id = `foi-${s.title.toLowerCase().replace(/\W+/g, "-")}`;
        return (
          <section key={s.title} aria-labelledby={id} className="mt-10">
            <div className="flex items-baseline gap-2">
              <h2 id={id} className="text-lg font-medium">
                {s.title}
              </h2>
              <span className="tnum text-sm text-muted-foreground">{items.length}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{s.hint}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {items.map((v) => (
                <li key={v.id}>
                  <Card v={v} quiet={!!s.quiet} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

function Card({ v, quiet }: { v: FoiView; quiet: boolean }) {
  return (
    <article
      aria-label={v.subject}
      className={cn(
        "grid gap-x-8 gap-y-5 rounded-xl p-5 sm:grid-cols-[9rem_minmax(0,1fr)]",
        quiet ? "bg-muted/60" : "bg-card shadow-raised",
      )}
    >
      {/* Time */}
      <div className="flex flex-col items-start gap-2 sm:border-r sm:pr-6">
        <p className={cn("tnum text-xl leading-tight font-medium", paceText(v))}>{dueText(v)}</p>
        {v.stage !== "sent" && <p className="tnum text-xs text-muted-foreground">Due {formatDate(v.due, { year: false })}</p>}
        <Badge variant={paceBadge[v.pace]}>{paceLabel[v.pace]}</Badge>
      </div>

      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">
          {v.subject} · <span className="tnum">{v.ref}</span> · {v.requester}
        </p>
        <h3 className="mt-1 text-lg leading-snug font-medium text-pretty">{v.next}</h3>

        <PaceBar v={v} />

        {v.blockers.length > 0 && (
          <div className="mt-4 flex gap-2 rounded-lg bg-critical-muted px-3 py-2.5 text-sm text-critical">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p className="text-pretty">
              <span className="font-medium">Stops it being sent: </span>
              {v.blockers[0]}
              {v.checks.length > 0 && (
                <span>
                  {" "}
                  Plus {v.checks.length} {v.checks.length === 1 ? "thing" : "things"} to check.
                </span>
              )}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant={quiet ? "outline" : "default"}>
            <Link href={`/foi/${v.id}`}>
              {v.action} <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            Whose move <Owner v={v} />
          </span>
        </div>
      </div>
    </article>
  );
}

/** The 20 working days: used so far, the target marks, and the next target in words */
function PaceBar({ v }: { v: FoiView }) {
  if (v.stage === "sent") return <p className="mt-4 text-sm text-muted-foreground">Sent on working day {v.elapsed} of 20.</p>;
  const next = milestones.find((m) => m.day > v.elapsed) ?? milestones[milestones.length - 1];
  const fill = v.pace === "overdue" ? "bg-critical" : v.pace === "behind" ? "bg-warning" : "bg-ring";
  return (
    <div className="mt-4">
      <div className="relative" aria-hidden>
        <div className="flex gap-[2px]">
          {Array.from({ length: 20 }).map((_, i) => (
            <span key={i} className={cn("h-2 flex-1 rounded-[1px]", i < v.elapsed ? fill : "bg-border")} />
          ))}
        </div>
        {/* Target marks sit on the boundary after their day */}
        {milestones.slice(0, 3).map((m) => (
          <span key={m.day} className="absolute -top-1 -bottom-1 w-0.5 bg-foreground" style={{ left: `calc(${(m.day / 20) * 100}% - 1px)` }} />
        ))}
      </div>
      <div className="relative mt-1.5 h-4 text-[11px] text-muted-foreground" aria-hidden>
        {milestones.map((m) => (
          <span key={m.day} className="absolute -translate-x-1/2 whitespace-nowrap last:-translate-x-full" style={{ left: `${(m.day / 20) * 100}%` }}>
            {m.label}
          </span>
        ))}
      </div>
      <p className={cn("mt-2 text-sm", paceText(v) || "text-muted-foreground")}>
        <span className="tnum font-medium">Day {v.elapsed} of 20</span>
        {v.pace === "overdue"
          ? ". Past the legal deadline."
          : v.pace === "behind"
            ? `. Behind: should be at “${milestones.find((m) => m.stage === v.expectedStage)?.label.toLowerCase() ?? "a later stage"}” by now.`
            : `. Next target: ${next.label.toLowerCase()} by ${targetDate(v, next.day)}.`}
      </p>
    </div>
  );
}

function Owner({ v }: { v: FoiView }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-foreground">
      {v.owner.id ? (
        <PersonAvatar id={v.owner.id} className="size-5" decorative />
      ) : (
        <span className="grid size-5 place-items-center rounded-full bg-secondary text-secondary-foreground" aria-hidden>
          <Bot className="size-3" />
        </span>
      )}
      <span className="truncate">{v.owner.name}</span>
    </span>
  );
}
