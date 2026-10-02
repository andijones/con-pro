/**
 * Contravo composites. Every one is built from shadcn/ui primitives and semantic tokens,
 * so a token change in globals.css flows through here and on to every screen.
 */
import Link from "next/link";
import { AlertTriangle, Check, CircleDashed, FileText, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { people, type ContractStatus } from "@/lib/data";
import { daysUntil, formatDate } from "@/lib/dates";
import { urgency } from "@/lib/derive";

/* ---------- People ---------- */

/**
 * Initials avatar. Has an accessible name ("Priya Shah, Head of Procurement") unless `decorative`,
 * which is for when the name is already visible next to it.
 */
export function PersonAvatar({ id, className, decorative }: { id: string | null | undefined; className?: string; decorative?: boolean }) {
  const p = id ? people[id] : undefined;
  const name = p ? `${p.name}, ${p.role}` : "Unassigned";
  return (
    <Avatar
      className={cn("size-6", className)}
      title={decorative ? undefined : name}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      <AvatarFallback className="bg-secondary text-[10px] font-medium text-secondary-foreground">
        {p?.initials ?? "–"}
      </AvatarFallback>
    </Avatar>
  );
}

export function Person({ id, short }: { id: string | null | undefined; short?: boolean }) {
  const p = id ? people[id] : undefined;
  if (!p) return <span className="text-sm text-muted-foreground">Unassigned</span>;
  return (
    <span className="inline-flex min-w-0 items-center gap-2 text-sm">
      <PersonAvatar id={id} decorative />
      <span className="truncate">{short ? p.name.replace(/^Dr /, "").split(" ")[0] : p.name}</span>
    </span>
  );
}

/* ---------- Status ---------- */

const statusVariant: Record<ContractStatus, "success" | "warning" | "critical" | "outline" | "secondary"> = {
  "Awaiting upload": "outline",
  Draft: "outline",
  "Under review": "secondary",
  "Legal review": "secondary",
  Active: "success",
  Expired: "warning",
  Terminated: "outline",
  Archived: "outline",
  Deleted: "critical",
};

export function StatusBadge({ status }: { status: ContractStatus }) {
  return <Badge variant={statusVariant[status]}>{status}</Badge>;
}

export function ExtractionBadge({ state }: { state?: "Reading" | "Ready to review" | "Reviewed" }) {
  if (state === "Ready to review")
    return (
      <Badge variant="success">
        <Check data-icon="inline-start" /> Ready to review
      </Badge>
    );
  if (state === "Reading")
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Loader2 data-icon="inline-start" className="animate-spin" /> Reading
      </Badge>
    );
  return null;
}

export function ToneBadge({ tone, children }: { tone: "success" | "warning" | "critical"; children: React.ReactNode }) {
  const Icon = tone === "success" ? Check : tone === "warning" ? AlertTriangle : X;
  return (
    <Badge variant={tone}>
      <Icon data-icon="inline-start" /> {children}
    </Badge>
  );
}

export function ConfidenceBadge({ value }: { value: number }) {
  const tone = value === 0 ? "critical" : value < 50 ? "warning" : value < 80 ? "outline" : "success";
  return (
    <Badge variant={tone} className="tnum" title={`Confidence ${value}%`}>
      {value === 0 ? <CircleDashed data-icon="inline-start" /> : null}
      {value === 0 ? "Not found" : `${value}%`}
    </Badge>
  );
}

/* ---------- Deadlines: the most visible thing on a screen ---------- */

export function Countdown({ date, label, size = "md" }: { date: string; label?: string; size?: "sm" | "md" }) {
  const d = daysUntil(date);
  const u = urgency(d);
  const color = u === "overdue" || u === "urgent" ? "text-critical" : u === "soon" ? "text-warning" : "text-foreground";
  if (size === "sm") {
    return (
      <span className="inline-flex flex-col leading-tight">
        <span className={cn("tnum text-sm font-medium", color)}>{d < 0 ? `${-d}d overdue` : d === 0 ? "Today" : `${d} days`}</span>
        <span className="tnum text-xs text-muted-foreground">{formatDate(date)}</span>
      </span>
    );
  }
  return (
    <div className="flex flex-col">
      <span className={cn("tnum text-[2rem] leading-none tracking-[-0.03em]", color)}>
        {d < 0 ? -d : d}
        <span className="ml-1 text-sm tracking-normal">{d < 0 ? "days late" : d === 1 ? "day" : "days"}</span>
      </span>
      <span className="tnum mt-1.5 text-xs text-muted-foreground">
        {label ? `${label} · ` : ""}
        {formatDate(date)}
      </span>
    </div>
  );
}

/* ---------- Evidence: every insight links back to its clause ---------- */

export function ClauseLink({ contractId, clause, contractTitle }: { contractId: string; clause: string; contractTitle?: string }) {
  return (
    <Badge variant="outline" asChild className="h-6 max-w-full gap-1.5 rounded-md px-2 font-normal text-muted-foreground">
      <Link href={`/contracts/${contractId}?clause=${encodeURIComponent(clause)}`}>
        <FileText data-icon="inline-start" />
        <span className="font-medium text-foreground">Clause {clause}</span>
        {contractTitle && <span className="truncate">· {contractTitle}</span>}
      </Link>
    </Badge>
  );
}

/* ---------- Page scaffolding ---------- */

export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-2 text-[13px] font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="heading text-[2.25rem] text-balance">{title}</h1>
        {children && <div className="mt-2 max-w-[65ch] text-base text-pretty text-muted-foreground">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Stat({
  value,
  label,
  href,
  tone,
}: {
  value: React.ReactNode;
  label: string;
  href?: string;
  tone?: "critical" | "warning" | "success";
}) {
  const body = (
    <>
      <span
        className={cn(
          "tnum block text-2xl tracking-[-0.02em]",
          tone === "critical" && "text-critical",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success",
        )}
      >
        {value}
      </span>
      <span className="mt-1 block text-[13px] text-muted-foreground">{label}</span>
    </>
  );
  const cls = "block rounded-lg bg-card px-4 py-3.5 shadow-card transition-[background-color,box-shadow] duration-(--duration-fast)";
  return href ? (
    <Link href={href} className={cn(cls, "hover:shadow-raised")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
