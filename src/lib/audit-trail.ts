/**
 * The audit trail as plain-English events: who did what to which record, when, and what changed.
 * Decision record: docs/decisions/audit.md
 */
import { Bot, Download, Eye, FileUp, Inbox, MessageSquare, Pencil, RefreshCw, ShieldAlert, Trash2, UserPlus, type LucideIcon } from "lucide-react";
import { audit, contracts, foiRequests, people, workspace } from "@/lib/data";
import { TODAY } from "@/lib/dates";

export type Kind = "viewed" | "edited" | "uploaded" | "assigned" | "asked" | "foi" | "status" | "contravo" | "staff" | "deleted" | "exported";

export const kinds: Record<Kind, { label: string; icon: LucideIcon }> = {
  viewed: { label: "Viewed", icon: Eye },
  edited: { label: "Edited", icon: Pencil },
  uploaded: { label: "Uploaded", icon: FileUp },
  assigned: { label: "Assigned", icon: UserPlus },
  asked: { label: "Asked", icon: MessageSquare },
  foi: { label: "FOI", icon: Inbox },
  status: { label: "Status change", icon: RefreshCw },
  contravo: { label: "Contravo", icon: Bot },
  staff: { label: "Contravo staff", icon: ShieldAlert },
  deleted: { label: "Deleted", icon: Trash2 },
  exported: { label: "Exported", icon: Download },
};

export type Ev = {
  id: string;
  at: string; // ISO, UTC
  who: string; // person id, "system" or "staff"
  kind: Kind;
  what: string; // verb phrase
  object?: { key: string; label: string; href?: string };
  detail?: string;
  diff?: { field: string; from: string; to: string }[];
  staff?: { name: string; reason: string };
};

const c = (id: string) => {
  const k = workspace.find((x) => x.id === id)!;
  return { key: `c:${id}`, label: k.title, href: `/contracts/${id}` };
};
const f = (id: string) => {
  const r = foiRequests.find((x) => x.id === id)!;
  return { key: `f:${id}`, label: `${r.ref} · ${r.subject}`, href: `/foi/${id}` };
};

const kindOf = (e: (typeof audit)[number]): Kind => {
  if (e.staff) return "staff";
  if (e.who === "system") return "contravo";
  if (e.target.startsWith("FOI-")) return "foi";
  if (/viewed|opened/.test(e.what)) return "viewed";
  if (/uploaded/.test(e.what)) return "uploaded";
  if (/assigned/.test(e.what)) return "assigned";
  if (/asked/.test(e.what)) return "asked";
  if (/deleted/.test(e.what)) return "deleted";
  if (/terminated|submitted/.test(e.what)) return "status";
  return "edited";
};
const objectFor = (href?: string, target?: string) => {
  const m = href?.match(/^\/(contracts|foi)\/([^/?]+)/);
  if (!m) return target ? { key: `t:${target}`, label: target } : undefined;
  return m[1] === "contracts" ? c(m[2]) : f(m[2]);
};

// The real trail, normalised
const real: Ev[] = audit.map((e, i) => ({
  id: `r${i}`,
  at: e.at,
  who: e.who,
  kind: kindOf(e),
  what: e.what.replace(/ (on|for|of|across)$/, ""),
  object: objectFor(e.href, e.target),
  staff: e.staff,
}));
// Richer detail on a few real events
for (const e of real) {
  if (e.what.startsWith("corrected the end date")) e.diff = [{ field: "End date", from: "30 Jun 2027", to: "31 Jul 2027" }];
  if (e.what.startsWith("assigned Leon Barker")) e.diff = [{ field: "Owner", from: "No owner", to: "Leon Barker" }];
  if (e.what.startsWith("terminated")) e.diff = [{ field: "Status", from: "Active", to: "Terminated" }];
  if (e.what.startsWith("submitted for review")) e.diff = [{ field: "Status", from: "Draft", to: "Under review" }];
}

// Concept history: earlier activity, so the trail reads like a real workspace's
const extra: Ev[] = [
  { id: "x1", at: "2026-10-01T06:00:00Z", who: "system", kind: "contravo", what: "checked every contract overnight", detail: `${contracts.length} contracts. 1 new issue found.` },
  { id: "x2", at: "2026-09-30T06:00:00Z", who: "system", kind: "contravo", what: "checked every contract overnight", detail: `${contracts.length} contracts. Nothing new.` },
  { id: "x3", at: "2026-09-29T06:00:00Z", who: "system", kind: "contravo", what: "checked every contract overnight", detail: `${contracts.length} contracts. 1 new issue found.` },
  { id: "x4", at: "2026-09-30T14:05:00Z", who: "priya", kind: "edited", what: "changed the review date", object: c("car-parking"), diff: [{ field: "Review date", from: "Not set", to: "1 Mar 2027" }] },
  { id: "x5", at: "2026-09-30T13:47:00Z", who: "priya", kind: "edited", what: "added the business unit", object: c("car-parking"), diff: [{ field: "Business unit", from: "None recorded", to: "Estates" }] },
  { id: "x6", at: "2026-09-30T10:12:00Z", who: "tom", kind: "exported", what: "exported the contracts list", detail: "21 contracts, CSV" },
  { id: "x7", at: "2026-09-30T09:30:00Z", who: "amara", kind: "viewed", what: "viewed clause 3.2 (notice)", object: c("mes-imaging") },
  { id: "x8", at: "2026-09-30T09:34:00Z", who: "amara", kind: "asked", what: "asked", detail: "“What happens if we miss the imaging notice date?”" },
  { id: "x9", at: "2026-09-29T14:20:00Z", who: "leon", kind: "edited", what: "corrected the annual value", object: c("linen"), diff: [{ field: "Annual value", from: "£450,000", to: "£540,000" }] },
  { id: "x10", at: "2026-09-29T11:15:00Z", who: "sam", kind: "foi", what: "logged a new request", object: f("foi-0419") },
  { id: "x11", at: "2026-09-29T09:05:00Z", who: "priya", kind: "viewed", what: "viewed", object: c("path-reagents") },
  { id: "x12", at: "2026-09-28T15:10:00Z", who: "sam", kind: "foi", what: "sent the draft to the reviewer", object: f("foi-0398") },
  { id: "x13", at: "2026-09-28T10:30:00Z", who: "priya", kind: "edited", what: "set the notice period", object: c("vaccine-cold-chain"), diff: [{ field: "Notice period", from: "Not recorded", to: "30 days" }] },
  { id: "x14", at: "2026-09-25T16:45:00Z", who: "tom", kind: "viewed", what: "viewed the charges schedule", object: c("mes-imaging") },
  { id: "x15", at: "2026-09-25T14:00:00Z", who: "amara", kind: "assigned", what: "took ownership", object: c("vaccine-cold-chain"), diff: [{ field: "Owner", from: "Priya Shah", to: "Dr Amara Okafor" }] },
  { id: "x16", at: "2026-09-25T09:40:00Z", who: "sam", kind: "foi", what: "confirmed the scope (1 contract)", object: f("foi-0398") },
  { id: "x17", at: "2026-09-24T13:22:00Z", who: "system", kind: "contravo", what: "drafted a reply", object: f("foi-0398") },
  { id: "x18", at: "2026-09-24T11:00:00Z", who: "leon", kind: "uploaded", what: "uploaded a variation", object: c("cleaning"), detail: "Variation 3 (4 pages)" },
  { id: "x19", at: "2026-09-23T15:30:00Z", who: "priya", kind: "status", what: "activated", object: c("mri-mobile"), diff: [{ field: "Status", from: "Legal review", to: "Active" }] },
  { id: "x20", at: "2026-09-22T10:10:00Z", who: "priya", kind: "viewed", what: "viewed", object: c("epr") },
  { id: "x21", at: "2026-09-18T12:00:00Z", who: "sam", kind: "foi", what: "logged a new request", object: f("foi-0412") },
  { id: "x22", at: "2026-09-17T09:15:00Z", who: "tom", kind: "edited", what: "corrected the currency", object: c("desktop-support"), diff: [{ field: "Currency", from: "GBP", to: "USD" }] },
  { id: "x23", at: "2026-09-16T14:40:00Z", who: "leon", kind: "edited", what: "corrected the supplier name", object: c("cleaning"), diff: [{ field: "Supplier", from: "Brightwell Facilities Ltd", to: "Brightwell Facilities Services Ltd" }] },
  { id: "x24", at: "2026-09-15T10:00:00Z", who: "priya", kind: "uploaded", what: "uploaded", object: c("mri-mobile") },
  { id: "x25", at: "2026-09-15T10:03:00Z", who: "system", kind: "contravo", what: "finished reading", object: c("mri-mobile"), detail: "11 fields found, 2 need checking" },
  { id: "x26", at: "2026-09-14T16:20:00Z", who: "amara", kind: "viewed", what: "viewed", object: c("vaccine-cold-chain") },
];

export const events: Ev[] = [...real, ...extra].sort((a, b) => b.at.localeCompare(a.at));

export const nameOf = (e: Ev) => (people[e.who]?.name ?? (e.who === "staff" ? (e.staff?.name ?? "Contravo staff") : "Contravo"));

export const dayKey = (iso: string) => iso.slice(0, 10);
export function dayLabel(key: string) {
  const today = TODAY.toISOString().slice(0, 10);
  const yesterday = new Date(TODAY.getTime() - 86_400_000).toISOString().slice(0, 10);
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}
export const time = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
export const stamp = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

export function ago(iso: string) {
  const mins = Math.round((TODAY.getTime() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  const d = Math.round(mins / 1440);
  return d === 1 ? "yesterday" : `${d} days ago`;
}

/* ---------- Records: every contract and FOI request with its history ---------- */

export type AuditRecord = { key: string; label: string; href?: string; kind: "contract" | "foi" | "workspace"; events: Ev[] };

export const records: AuditRecord[] = (() => {
  const map = new Map<string, AuditRecord>();
  for (const e of events) {
    const key = e.object?.key.startsWith("t:") || !e.object ? "workspace" : e.object.key;
    if (!map.has(key))
      map.set(
        key,
        key === "workspace"
          ? { key, label: "Across the workspace", kind: "workspace", events: [] }
          : { key, label: e.object!.label, href: e.object!.href, kind: key.startsWith("f:") ? "foi" : "contract", events: [] },
      );
    map.get(key)!.events.push(e);
  }
  return [...map.values()];
})();
