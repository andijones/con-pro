"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, History, Lightbulb, Pencil, ScanSearch, Undo2 } from "lucide-react";
import { toast } from "sonner";
import type { Contract } from "@/lib/data";
import { people } from "@/lib/data";
import type { DocPage, ExtractedField, FieldGroup } from "@/lib/extraction";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BackLink, ConfidenceBadge, PageHeader } from "./primitives";
import { DocumentViewer } from "./document-viewer";

type FieldState = { value: string | null; status: "pending" | "accepted" | "edited" };

const groups: FieldGroup[] = ["General", "Parties", "Key dates", "Financial"];
const LOW = 50;

export function ReviewWorkspace({ contract, fields, pages }: { contract: Contract; fields: ExtractedField[]; pages: DocPage[] }) {
  const router = useRouter();
  const [state, setState] = useState<Record<string, FieldState>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, { value: f.value, status: "pending" as const }])),
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [focus, setFocus] = useState<{ page: number; quote?: string; nonce: number; key: string } | undefined>();
  const [confirmAll, setConfirmAll] = useState(false);

  const reviewed = Object.values(state).filter((s) => s.status !== "pending").length;
  const pending = fields.filter((f) => state[f.key].status === "pending");
  const lowPending = pending.filter((f) => f.confidence < LOW);
  const requiredMissing = fields.filter((f) => f.required && state[f.key].status === "pending");

  const byGroup = useMemo(() => groups.map((g) => ({ g, items: fields.filter((f) => f.group === g) })).filter((x) => x.items.length), [fields]);

  function set(key: string, next: Partial<FieldState>) {
    setState((s) => ({ ...s, [key]: { ...s[key], ...next } }));
  }

  function find(f: ExtractedField, page = f.page) {
    if (!page) return;
    setFocus({ page, quote: f.quote, nonce: Date.now(), key: f.key });
  }

  function acceptAll() {
    setState((s) =>
      Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.status === "pending" ? { ...v, status: "accepted" as const } : v])),
    );
    toast.success(`Accepted ${pending.length} fields`);
  }

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-6rem)]">
      <PageHeader
        title="Review what the AI read"
        leading={<BackLink href="/contracts" label="contracts" />}
        actions={
          <>
          <Button
            onClick={() => {
              if (requiredMissing.length) {
                toast.error("Check the contract name first", { description: "It’s required before you can continue." });
                find(requiredMissing[0]);
                return;
              }
              router.push(`/contracts/${contract.id}/details`);
            }}
          >
            Continue to details
          </Button>
          </>
        }
      >
        Step 1 of 2 · {contract.fileName ?? contract.title}
      </PageHeader>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* Fields */}
        <Card className="min-h-0 gap-0 py-0">
          <div className="border-b p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="tnum text-sm" role="status" aria-live="polite">
                <span className="font-medium">{reviewed}</span> of {fields.length} reviewed
                {lowPending.length > 0 && <span className="text-warning"> · {lowPending.length} need a closer look</span>}
              </p>
              <Button variant="outline" size="sm" disabled={!pending.length} onClick={() => (lowPending.length ? setConfirmAll(true) : acceptAll())}>
                Accept all remaining
              </Button>
            </div>
            <Progress value={(reviewed / fields.length) * 100} aria-label="Fields reviewed" className="mt-3 h-1.5" />
          </div>

          <div tabIndex={0} role="region" aria-label="Extracted fields" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {byGroup.map(({ g, items }) => (
              <section key={g}>
                <h2 className="sticky top-0 z-(--z-sticky) border-b bg-card pt-4 pb-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {g}
                </h2>
                <ul className="divide-y">
                  {items.map((f) => {
                    const st = state[f.key];
                    const done = st.status !== "pending";
                    const low = f.confidence < LOW && !done;
                    const isEditing = editing === f.key;
                    return (
                      <li
                        key={f.key}
                        className={cn(
                          "-mx-2 rounded-md px-2 py-3 transition-colors",
                          focus?.key === f.key && "bg-highlight/60",
                          low && "border-l-2 border-l-warning",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("min-w-0 flex-1 text-[13px]", done ? "text-muted-foreground" : "text-foreground")}>
                            {f.label}
                            {f.required && <span className="text-critical"> *</span>}
                          </span>
                          {done ? (
                            <span className="inline-flex items-center gap-1 text-xs text-success">
                              <Check className="size-3.5" aria-hidden /> {st.status === "edited" ? "Corrected" : "Accepted"}
                            </span>
                          ) : (
                            <ConfidenceBadge value={f.confidence} />
                          )}
                          {/* edge-to-edge icon buttons: button-group slot makes hit areas grow vertically only */}
                          <div data-slot="button-group" className="flex items-center">
                            <IconAction label="Show in document" disabled={!f.page} onClick={() => find(f)}>
                              <ScanSearch />
                            </IconAction>
                            <Popover>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon-sm" aria-label="History">
                                      <History />
                                    </Button>
                                  </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent>History</TooltipContent>
                              </Tooltip>
                              <PopoverContent align="end" className="w-72 text-sm">
                                <p className="mb-2 font-medium">History</p>
                                <ul className="flex flex-col gap-2 text-xs">
                                  <li>
                                    <span className="text-muted-foreground">30 Sept, 14:28 · Read by AI</span>
                                    <p className="mt-0.5 text-foreground">{f.value ?? "Not found"}</p>
                                  </li>
                                  {done && (
                                    <li>
                                      <span className="text-muted-foreground">
                                        Just now · {st.status === "edited" ? "Corrected" : "Accepted"} by {people.priya.name}
                                      </span>
                                      <p className="mt-0.5 text-foreground">{st.value ?? "Left blank"}</p>
                                    </li>
                                  )}
                                </ul>
                              </PopoverContent>
                            </Popover>
                            <IconAction
                              label="Edit"
                              onClick={() => {
                                setEditing(f.key);
                                setDraft(st.value ?? f.suggestion?.value ?? "");
                              }}
                            >
                              <Pencil />
                            </IconAction>
                            {done ? (
                              <IconAction label="Undo" onClick={() => set(f.key, { status: "pending", value: f.value })}>
                                <Undo2 />
                              </IconAction>
                            ) : (
                              <IconAction label="Accept" onClick={() => set(f.key, { status: "accepted" })} className="text-success hover:text-success">
                                <Check />
                              </IconAction>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <form
                            className="mt-2 flex flex-col gap-2"
                            onSubmit={(e) => {
                              e.preventDefault();
                              set(f.key, { value: draft.trim() || null, status: "edited" });
                              setEditing(null);
                            }}
                          >
                            {f.long ? (
                              <Textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
                            ) : (
                              <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
                            )}
                            <div className="flex gap-2">
                              <Button type="submit" size="sm">
                                Save
                              </Button>
                              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
                                Cancel
                              </Button>
                            </div>
                          </form>
                        ) : (
                          <p className={cn("mt-1 text-sm", f.long && "line-clamp-3", !st.value && "text-muted-foreground")}>
                            {st.value ?? "Not found in the document"}
                          </p>
                        )}

                        {!st.value && f.suggestion && !done && !isEditing && (
                          <div className="mt-2 rounded-md border border-dashed bg-muted/50 p-2.5 text-xs">
                            <p className="flex items-center gap-1.5 font-medium">
                              <Lightbulb className="size-3.5 text-primary" aria-hidden /> Found nearby: {f.suggestion.value}
                            </p>
                            <p className="mt-1 text-muted-foreground">{f.suggestion.why}</p>
                            <div className="mt-2 flex gap-1.5">
                              <Button size="xs" variant="secondary" onClick={() => set(f.key, { value: f.suggestion!.value, status: "edited" })}>
                                Use this
                              </Button>
                              <Button size="xs" variant="ghost" onClick={() => find(f, f.suggestion!.page)}>
                                Show page {f.suggestion.page}
                              </Button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </Card>

        {/* Document */}
        <Card className="min-h-[70vh] gap-0 overflow-hidden py-0 lg:min-h-0">
          <DocumentViewer pages={pages} focus={focus} />
        </Card>
      </div>

      <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Accept {pending.length} fields without checking them?</AlertDialogTitle>
            <AlertDialogDescription>
              {lowPending.length} of them have low confidence: {lowPending.map((f) => f.label.toLowerCase()).join(", ")}. Whatever you accept is
              what reports, alerts and FOI replies will use.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Check them first</AlertDialogCancel>
            <AlertDialogAction onClick={acceptAll}>Accept all</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function IconAction({
  label,
  children,
  onClick,
  disabled,
  className,
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled} className={className}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
