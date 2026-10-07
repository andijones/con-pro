"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarIcon, Send } from "lucide-react";
import { toast } from "sonner";
import type { Contract } from "@/lib/data";
import { businessUnits, people, workspace } from "@/lib/data";
import type { DocPage } from "@/lib/extraction";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DocumentViewer } from "./document-viewer";
import { BackLink, PageHeader } from "./primitives";

const NONE = "__none";

export function DetailsForm({ contract, pages, counterpartyRead }: { contract: Contract; pages: DocPage[]; counterpartyRead?: string | null }) {
  const router = useRouter();
  const initial = {
    title: contract.title,
    owner: contract.owner ?? NONE,
    unit: contract.businessUnit ?? NONE,
    counterparty: contract.supplier ?? counterpartyRead ?? NONE,
    review: contract.reviewDate ? new Date(`${contract.reviewDate}T12:00:00Z`) : undefined,
  };
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [reviewer, setReviewer] = useState<string>("");
  const [triedSubmit, setTriedSubmit] = useState(false);
  const dirty = JSON.stringify(v) !== JSON.stringify(saved);

  const counterparties = Array.from(
    new Set([counterpartyRead, ...workspace.map((c) => c.supplier)].filter(Boolean) as string[]),
  ).sort();

  function save() {
    setSaved(v);
    toast.success("Details saved");
  }

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-6rem)]">
      <PageHeader
        title="Add what the AI couldn’t"
        leading={<BackLink href="/contracts" label="contracts" />}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/contracts/${contract.id}/review`}>Back</Link>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Send data-icon="inline-start" /> Submit for review
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Submit for review</DialogTitle>
                  <DialogDescription>A named person checks the details before the contract goes live.</DialogDescription>
                </DialogHeader>
                <FieldGroup>
                  <Field data-invalid={triedSubmit && !reviewer ? true : undefined}>
                    <FieldLabel htmlFor="reviewer">Reviewer</FieldLabel>
                    <Select value={reviewer} onValueChange={setReviewer}>
                      <SelectTrigger id="reviewer" className="w-full" aria-invalid={triedSubmit && !reviewer ? true : undefined}>
                        <SelectValue placeholder="Choose a person" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(people).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} · {p.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {triedSubmit && !reviewer && <FieldError>Choose who should review it.</FieldError>}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="note">Note (optional)</FieldLabel>
                    <Textarea id="note" placeholder="Anything they should look at, e.g. the start date is blank on page 1" />
                  </Field>
                </FieldGroup>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      if (!reviewer) {
                        setTriedSubmit(true);
                        document.getElementById("reviewer")?.focus();
                        return;
                      }
                      toast.success(`Sent to ${people[reviewer].name} for review`, { description: "Status: Under review" });
                      router.push("/contracts");
                    }}
                  >
                    Submit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              onClick={() => {
                if (dirty) save();
                toast.success("Contract saved as Draft");
                router.push(`/contracts/${contract.id}`);
              }}
            >
              Finish
            </Button>
          </>
        }
      >
        Step 2 of 2 · {contract.fileName ?? contract.title}
      </PageHeader>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <Card className="min-h-0 overflow-y-auto">
          <CardHeader>
            <CardTitle className="eyebrow text-muted-foreground">Contract details</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                save();
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="title">Title</FieldLabel>
                  <Input id="title" value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} />
                  <FieldDescription>From the file: {contract.fileName}</FieldDescription>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="owner">Owner</FieldLabel>
                    <Select value={v.owner} onValueChange={(owner) => setV({ ...v, owner })}>
                      <SelectTrigger id="owner" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {Object.values(people).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Gets the alerts for this contract.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="unit">Business unit</FieldLabel>
                    <Select value={v.unit} onValueChange={(unit) => setV({ ...v, unit })}>
                      <SelectTrigger id="unit" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>None</SelectItem>
                        {businessUnits.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="cp">Counterparty</FieldLabel>
                  <Select value={v.counterparty} onValueChange={(counterparty) => setV({ ...v, counterparty })}>
                    <SelectTrigger id="cp" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>None</SelectItem>
                      {counterparties.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                          {c === counterpartyRead ? " (read from document)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="review">Review date</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button id="review" variant="outline" className="w-full justify-start font-normal sm:w-64">
                        <CalendarIcon data-icon="inline-start" />
                        {v.review ? v.review.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : <span className="text-muted-foreground">Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={v.review} onSelect={(review) => setV({ ...v, review })} />
                    </PopoverContent>
                  </Popover>
                  <FieldDescription>When someone should look at this contract again. It appears on Home and the timeline.</FieldDescription>
                </Field>

                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={!dirty}>
                    Save details
                  </Button>
                  <span className="text-xs text-muted-foreground">{dirty ? "Unsaved changes" : "Nothing to save."}</span>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>

        <Card className="min-h-[70vh] gap-0 overflow-hidden py-0 lg:min-h-0">
          <DocumentViewer pages={pages} />
        </Card>
      </div>
    </div>
  );
}
