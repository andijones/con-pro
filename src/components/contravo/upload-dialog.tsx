"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { contractTypes } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function UploadDialog({ trigger }: { trigger?: React.ReactNode }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [tried, setTried] = useState(false);

  function reset() {
    setType("");
    setFile(null);
    setProgress(null);
    setTried(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // WCAG 3.3.1: explain what's missing instead of silently disabling the button
    if (!type || !file) {
      setTried(true);
      document.getElementById(!type ? "contract-type" : "contract-file-button")?.focus();
      return;
    }
    // Concept: simulate upload + extraction, then hand over to the review step
    setProgress(10);
    const t = [setTimeout(() => setProgress(55), 400), setTimeout(() => setProgress(100), 900)];
    setTimeout(() => {
      t.forEach(clearTimeout);
      setOpen(false);
      reset();
      toast.success("Contract uploaded", { description: "The AI has read it. Check what it found." });
      router.push("/contracts/locum-rpo/review");
    }, 1300);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Upload data-icon="inline-start" /> Upload contract
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Upload a contract</DialogTitle>
            <DialogDescription>The AI reads it in about a minute. You check what it found before anything is saved.</DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-6">
            <Field data-invalid={tried && !type ? true : undefined}>
              <FieldLabel htmlFor="contract-type">
                Contract type <span className="text-critical">*</span>
              </FieldLabel>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger
                  id="contract-type"
                  className="w-full"
                  aria-invalid={tried && !type ? true : undefined}
                  aria-describedby={tried && !type ? "contract-type-error" : "contract-type-hint"}
                >
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {contractTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tried && !type ? (
                <FieldError id="contract-type-error">Choose a contract type.</FieldError>
              ) : (
                <FieldDescription id="contract-type-hint">Decides which fields the AI looks for.</FieldDescription>
              )}
            </Field>

            <Field data-invalid={tried && !file ? true : undefined}>
              <FieldLabel htmlFor="contract-file-button">
                Contract file <span className="text-critical">*</span>
              </FieldLabel>
              <input
                ref={input}
                id="contract-file"
                type="file"
                accept="application/pdf"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center gap-3 rounded-lg bg-muted/60 px-3 py-2.5 shadow-xs">
                  <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                  <span className="tnum text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                  <Button type="button" variant="ghost" size="icon-xs" aria-label="Remove file" onClick={() => setFile(null)}>
                    <X />
                  </Button>
                </div>
              ) : (
                <button
                  id="contract-file-button"
                  type="button"
                  aria-describedby={tried && !file ? "contract-file-error" : undefined}
                  onClick={() => input.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDrag(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) setFile(f);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-accent/40",
                    drag && "border-ring bg-highlight/50",
                  )}
                >
                  <Upload className="size-5" aria-hidden />
                  <span>
                    Drag a PDF here, or <span className="font-medium text-primary">choose a file</span>
                  </span>
                </button>
              )}
              {tried && !file && <FieldError id="contract-file-error">Choose a PDF to upload.</FieldError>}
            </Field>
          </FieldGroup>

          {progress !== null && (
            <div className="mb-4">
              <Progress value={progress} aria-label="Upload progress" className="h-1.5" />
              <p className="mt-1.5 text-xs text-muted-foreground" role="status">{progress < 100 ? "Uploading…" : "Reading the document…"}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" className="w-full" disabled={progress !== null}>
              Create and upload
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
