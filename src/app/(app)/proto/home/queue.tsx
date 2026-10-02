"use client";
// Throwaway: /proto/home variant "Queue". One triage list of everything that needs a person.
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BellOff, CalendarClock, Check, FileSearch, Inbox, Sparkles, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { people } from "@/lib/data";
import { daysLeft, gbp } from "@/lib/dates";
import { ago } from "@/lib/audit-trail";
import { cn } from "@/lib/utils";
import { PageHeader, PersonAvatar } from "@/components/contravo/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DataHealth } from "./estate";
import { me, reading, sinceYesterday, tasks, toReview, type Task } from "./shared";

const kindLabel: Record<Task["kind"], { label: string; icon: typeof Inbox }> = {
  decision: { label: "Decision", icon: CalendarClock },
  gap: { label: "Missing information", icon: FileSearch },
  review: { label: "Check the AI", icon: Sparkles },
  foi: { label: "FOI request", icon: Inbox },
};
const tone = (d: number | null) => (d == null ? "text-muted-foreground" : d <= 7 ? "text-critical" : d <= 31 ? "text-warning" : "text-muted-foreground");

export function Queue({ withHealth = false }: { withHealth?: boolean }) {
  const [scope, setScope] = useState<"mine" | "team">("mine");
  const [done, setDone] = useState<string[]>([]);
  const [snoozed, setSnoozed] = useState<string[]>([]);
  const [owners, setOwners] = useState<Record<string, string>>({});
  const ownerOf = (t: Task) => owners[t.id] ?? t.owner;
  const live = tasks.filter((t) => !done.includes(t.id) && !snoozed.includes(t.id));
  const list = scope === "mine" ? live.filter((t) => ownerOf(t) === me) : live;
  const mineCount = live.filter((t) => ownerOf(t) === me).length;

  const undoable = (msg: string, t: Task, undo: () => void) =>
    toast(msg, { description: t.context, action: { label: "Undo", onClick: undo }, duration: Infinity });

  return (
    <div>
      <PageHeader
        title="Good morning, Priya"
        actions={
          <ToggleGroup type="single" variant="outline" value={scope} onValueChange={(v) => v && setScope(v as "mine" | "team")} aria-label="Whose work">
            <ToggleGroupItem value="mine">Mine · {mineCount}</ToggleGroupItem>
            <ToggleGroupItem value="team">Team · {live.length}</ToggleGroupItem>
          </ToggleGroup>
        }
      >
        {list.length === 0 ? "You’re clear. Nothing needs you." : `${list.length} things need ${scope === "mine" ? "you" : "the team"}, soonest first. Decisions, checks of what the AI read and FOI replies, in one list.`}
      </PageHeader>

      <div className={cn("mt-8 grid gap-8", withHealth ? "lg:grid-cols-[minmax(0,1fr)_20rem]" : "lg:grid-cols-[minmax(0,1fr)_18rem]")}>
        <section aria-labelledby="q-h">
          <h2 id="q-h" className="sr-only">
            Your queue
          </h2>
          {list.length === 0 ? (
            <div className="rounded-xl bg-muted px-6 py-10 text-center">
              <p className="font-medium">All clear</p>
              <p className="mt-1 text-sm text-muted-foreground">Contravo checks every contract overnight and will add anything new here.</p>
            </div>
          ) : (
            <ol className="flex flex-col gap-2">
              {list.map((t) => {
                const K = kindLabel[t.kind];
                const owner = ownerOf(t);
                return (
                  <li key={t.id} className="grid gap-3 rounded-xl bg-card p-4 shadow-card sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center">
                    <div className={cn("tnum text-sm font-medium", tone(t.days))}>{t.days == null ? <span className="text-muted-foreground">No deadline</span> : daysLeft(t.days)}</div>
                    <div className="min-w-0">
                      <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <K.icon className="size-3.5 shrink-0" aria-hidden />
                        <span className="shrink-0 whitespace-nowrap">{K.label} ·</span>
                        <span className="min-w-0 truncate" title={t.context}>
                          {t.context}
                        </span>
                      </p>
                      <p className="mt-0.5 font-medium text-pretty">{t.title}</p>
                      {t.amount ? <p className="tnum mt-0.5 text-sm text-muted-foreground">{gbp(t.amount)} at stake</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Assign. Now ${owner ? people[owner].name : "unassigned"}`}>
                            {owner ? <PersonAvatar id={owner} className="size-6" decorative /> : <UserRoundPlus />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Assign to</DropdownMenuLabel>
                          {Object.values(people).map((p) => (
                            <DropdownMenuItem
                              key={p.id}
                              onSelect={() => {
                                const prev = owner;
                                setOwners((o) => ({ ...o, [t.id]: p.id }));
                                undoable(`Assigned to ${p.name}`, t, () => setOwners((o) => ({ ...o, [t.id]: prev ?? "" })));
                              }}
                            >
                              <PersonAvatar id={p.id} className="size-5" decorative /> {p.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Snooze for a week"
                        title="Snooze for a week"
                        onClick={() => {
                          setSnoozed((s) => [...s, t.id]);
                          undoable("Snoozed until next Thursday", t, () => setSnoozed((s) => s.filter((x) => x !== t.id)));
                        }}
                      >
                        <BellOff />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Mark as done"
                        title="Mark as done"
                        onClick={() => {
                          setDone((d) => [...d, t.id]);
                          undoable("Marked as done", t, () => setDone((d) => d.filter((x) => x !== t.id)));
                        }}
                      >
                        <Check />
                      </Button>
                      <Button size="sm" asChild>
                        <Link href={t.href}>
                          {t.action} <ArrowRight data-icon="inline-end" />
                        </Link>
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="flex flex-col gap-6" aria-label={withHealth ? "Data health and recent activity" : "Since you were last here"}>
          {withHealth && <DataHealth />}
          <section>
            <h2 className="mb-3 text-sm font-medium">Since you were last here</h2>
            <ol className="flex flex-col gap-3">
              {sinceYesterday.map((e) => (
                <li key={e.id} className="flex gap-2.5 text-sm">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0">
                    <span className="text-pretty">
                      {e.who === "system" ? "Contravo" : (people[e.who]?.name ?? "Someone")} {e.what}
                      {e.object ? (
                        <>
                          {" "}
                          {e.object.href ? (
                            <Link href={e.object.href} className="font-medium underline-offset-4 hover:underline">
                              {e.object.label}
                            </Link>
                          ) : (
                            e.object.label
                          )}
                        </>
                      ) : null}
                    </span>
                    {e.detail && <span className="block text-xs text-muted-foreground">{e.detail}</span>}
                    <span className="block text-xs text-muted-foreground">{ago(e.at)}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
          {!withHealth && (
            <section className="rounded-xl bg-muted p-4">
              <h2 className="text-sm font-medium">Reading</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {reading.length} contract{reading.length === 1 ? " is" : "s are"} being read. {toReview.length} {toReview.length === 1 ? "is" : "are"} ready for you to check.
              </p>
              <Badge variant="secondary" className="mt-3">
                Arrives in your queue when ready
              </Badge>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
