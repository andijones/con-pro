// Throwaway: /proto/reader. The imaging contract's real clauses inside a full-length agreement.
// Clauses marked `filler` are concept text: read by Contravo, nothing flagged. They exist so scanning is tested at real length.
import { getContract, type Clause } from "@/lib/data";

export type Risk = "high" | "medium" | "low";
export type Topic = "Money" | "Ending and renewal" | "Service" | "Liability" | "Tax" | "General";
export type DocClause = Clause & { topic: Topic; filler?: boolean; action?: { label: string; href: string } };
export type Part = { number: string; title: string; clauses: DocClause[] };

const real = getContract("mes-imaging")!.clauses;
const r = (id: string, topic: Topic, action?: DocClause["action"]): DocClause => ({ ...real.find((c) => c.id === id)!, topic, action });
const f = (number: string, heading: string, text: string, topic: Topic = "General"): DocClause => ({ id: number, number, heading, text, topic, filler: true });

export const contract = getContract("mes-imaging")!;

export const parts: Part[] = [
  { number: "1", title: "Definitions and interpretation", clauses: [r("1.1", "General"), f("1.2", "Interpretation", "Headings are for convenience only and do not affect interpretation. References to a statute include any amendment to it.")] },
  {
    number: "2",
    title: "Supply of equipment",
    clauses: [
      f("2.1", "Equipment", "The Supplier shall supply, install and commission the Equipment listed in Schedule 2 at the Sites."),
      f("2.2", "Ownership", "Title in the Equipment remains with the Supplier at all times. Risk passes to the Trust on installation."),
      f("2.3", "Replacement", "The Supplier shall replace any item of Equipment that reaches the end of its supported life during the Term at no additional charge.", "Service"),
    ],
  },
  {
    number: "3",
    title: "Term",
    clauses: [r("3.1", "Ending and renewal"), r("3.2", "Ending and renewal", { label: "Decide before 17 October", href: "/contracts/mes-imaging" })],
  },
  {
    number: "5",
    title: "Installation and acceptance",
    clauses: [
      f("5.1", "Installation", "The Supplier shall complete installation in accordance with the Implementation Plan in Schedule 4."),
      f("5.2", "Acceptance tests", "Each item of Equipment shall pass the Acceptance Tests before the Charges for it become payable.", "Money"),
    ],
  },
  {
    number: "7",
    title: "Charges and payment",
    clauses: [
      f("7.1", "Charges", "In consideration of the Services the Trust shall pay the Charges set out in Schedule 5.", "Money"),
      f("7.2", "Payment", "The Trust shall pay each valid invoice within thirty (30) days of receipt.", "Money"),
      r("7.3", "Money", { label: "Ask about challenging RPI", href: "/chat?q=Can%20we%20challenge%20uncapped%20RPI%20on%20the%20imaging%20contract%3F" }),
    ],
  },
  { number: "9", title: "Tax", clauses: [r("9.1", "Tax", { label: "Send to Finance", href: "/contracts/mes-imaging" }), f("9.2", "Withholding", "All sums payable are exclusive of VAT, which shall be added where applicable.", "Tax")] },
  {
    number: "10",
    title: "Invoicing",
    clauses: [
      f("10.1", "Invoices", "The Supplier shall invoice quarterly in arrears, quoting the Trust’s purchase order number.", "Money"),
      f("10.2", "Disputed invoices", "The Trust may withhold any disputed amount pending resolution under Clause 19.", "Money"),
    ],
  },
  { number: "12", title: "Service levels", clauses: [f("12.1", "Service levels", "The Supplier shall meet the Service Levels in Schedule 3.", "Service"), r("12.4", "Service")] },
  {
    number: "13",
    title: "Maintenance",
    clauses: [
      f("13.1", "Planned maintenance", "The Supplier shall carry out planned preventive maintenance at the intervals recommended by the manufacturer.", "Service"),
      f("13.2", "Response times", "The Supplier shall attend site within four (4) hours of a Priority 1 fault being logged.", "Service"),
    ],
  },
  { number: "14", title: "Supplier staff", clauses: [f("14.1", "Personnel", "The Supplier shall ensure all staff attending Sites are suitably qualified and have passed an enhanced DBS check.")] },
  { number: "15", title: "Confidentiality", clauses: [f("15.1", "Confidential information", "Each party shall keep the other’s Confidential Information confidential, subject to the Freedom of Information Act 2000.")] },
  {
    number: "16",
    title: "Liability and insurance",
    clauses: [
      f("16.1", "Indemnity", "The Supplier shall indemnify the Trust against losses arising from the Supplier’s negligence.", "Liability"),
      r("16.2", "Liability"),
      f("16.3", "Insurance", "The Supplier shall maintain public liability insurance of not less than £10,000,000.", "Liability"),
    ],
  },
  { number: "17", title: "Data protection", clauses: [f("17.1", "Processing", "The parties shall comply with the Data Protection Legislation. The Supplier processes personal data only on documented instructions.")] },
  {
    number: "18",
    title: "Termination",
    clauses: [
      f("18.1", "Termination for breach", "Either party may terminate on notice if the other commits a material breach not remedied within thirty (30) days.", "Ending and renewal"),
      r("18.3", "Ending and renewal"),
      f("18.5", "Exit assistance", "On expiry or termination the Supplier shall provide the exit assistance set out in Schedule 8.", "Ending and renewal"),
    ],
  },
  { number: "19", title: "Dispute resolution", clauses: [f("19.1", "Escalation", "Disputes shall be escalated to the parties’ contract managers and then to their directors before mediation.")] },
  { number: "20", title: "General", clauses: [f("20.1", "Entire agreement", "This Agreement constitutes the entire agreement between the parties."), f("20.2", "Governing law", "This Agreement is governed by the law of England and Wales.")] },
];

export const all = parts.flatMap((p) => p.clauses);
export const flagged = all.filter((c) => c.plain);
export const riskOrder: Record<Risk, number> = { high: 0, medium: 1, low: 2 };
export const riskLabel: Record<Risk, string> = { high: "High risk", medium: "Medium risk", low: "Low risk" };
/** Design-system Badge variants: high is red, medium amber, low green (always with the words) */
export const riskBadge: Record<Risk, "critical" | "warning" | "success"> = { high: "critical", medium: "warning", low: "success" };
export const riskTint: Record<Risk, string> = { high: "bg-critical-muted", medium: "bg-warning-muted", low: "bg-success-muted" };
export const riskEdge: Record<Risk, string> = { high: "border-critical", medium: "border-(--timeline-notice)", low: "border-success" };
export const counts = { high: flagged.filter((c) => c.risk === "high").length, medium: flagged.filter((c) => c.risk === "medium").length, low: flagged.filter((c) => c.risk === "low").length };
