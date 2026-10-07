/**
 * Full contract text, where the concept holds it: the agreement in order, part by part, so the reader can show the
 * whole document and the navigator can jump between the clauses Contravo flagged. Other contracts show the clauses
 * that were extracted. Unflagged clause text here is illustrative: read by Contravo, nothing to flag.
 * Decision record: docs/decisions/contract-reader.md
 */
import { getContract, type Clause } from "./data";

export type DocumentPart = { number: string; title: string; clauses: Clause[] };

const real = getContract("mes-imaging")!.clauses;
/** A clause Contravo flagged, taken from the contract's extracted clauses */
const r = (id: string): Clause => real.find((c) => c.id === id)!;
/** A clause that was read and has nothing flagged */
const f = (number: string, heading: string, text: string): Clause => ({ id: number, number, heading, text });

const imaging: DocumentPart[] = [
  { number: "1", title: "Definitions and interpretation", clauses: [r("1.1"), f("1.2", "Interpretation", "Headings are for convenience only and do not affect interpretation. References to a statute include any amendment to it.")] },
  {
    number: "2",
    title: "Supply of equipment",
    clauses: [
      f("2.1", "Equipment", "The Supplier shall supply, install and commission the Equipment listed in Schedule 2 at the Sites."),
      f("2.2", "Ownership", "Title in the Equipment remains with the Supplier at all times. Risk passes to the Trust on installation."),
      f("2.3", "Replacement", "The Supplier shall replace any item of Equipment that reaches the end of its supported life during the Term at no additional charge."),
    ],
  },
  {
    number: "3",
    title: "Term",
    clauses: [r("3.1"), r("3.2")],
  },
  {
    number: "5",
    title: "Installation and acceptance",
    clauses: [
      f("5.1", "Installation", "The Supplier shall complete installation in accordance with the Implementation Plan in Schedule 4."),
      f("5.2", "Acceptance tests", "Each item of Equipment shall pass the Acceptance Tests before the Charges for it become payable."),
    ],
  },
  {
    number: "7",
    title: "Charges and payment",
    clauses: [
      f("7.1", "Charges", "In consideration of the Services the Trust shall pay the Charges set out in Schedule 5."),
      f("7.2", "Payment", "The Trust shall pay each valid invoice within thirty (30) days of receipt."),
      r("7.3"),
    ],
  },
  { number: "9", title: "Tax", clauses: [r("9.1"), f("9.2", "Withholding", "All sums payable are exclusive of VAT, which shall be added where applicable.")] },
  {
    number: "10",
    title: "Invoicing",
    clauses: [
      f("10.1", "Invoices", "The Supplier shall invoice quarterly in arrears, quoting the Trust’s purchase order number."),
      f("10.2", "Disputed invoices", "The Trust may withhold any disputed amount pending resolution under Clause 19."),
    ],
  },
  { number: "12", title: "Service levels", clauses: [f("12.1", "Service levels", "The Supplier shall meet the Service Levels in Schedule 3."), r("12.4")] },
  {
    number: "13",
    title: "Maintenance",
    clauses: [
      f("13.1", "Planned maintenance", "The Supplier shall carry out planned preventive maintenance at the intervals recommended by the manufacturer."),
      f("13.2", "Response times", "The Supplier shall attend site within four (4) hours of a Priority 1 fault being logged."),
    ],
  },
  { number: "14", title: "Supplier staff", clauses: [f("14.1", "Personnel", "The Supplier shall ensure all staff attending Sites are suitably qualified and have passed an enhanced DBS check.")] },
  { number: "15", title: "Confidentiality", clauses: [f("15.1", "Confidential information", "Each party shall keep the other’s Confidential Information confidential, subject to the Freedom of Information Act 2000.")] },
  {
    number: "16",
    title: "Liability and insurance",
    clauses: [
      f("16.1", "Indemnity", "The Supplier shall indemnify the Trust against losses arising from the Supplier’s negligence."),
      r("16.2"),
      f("16.3", "Insurance", "The Supplier shall maintain public liability insurance of not less than £10,000,000."),
    ],
  },
  { number: "17", title: "Data protection", clauses: [f("17.1", "Processing", "The parties shall comply with the Data Protection Legislation. The Supplier processes personal data only on documented instructions.")] },
  {
    number: "18",
    title: "Termination",
    clauses: [
      f("18.1", "Termination for breach", "Either party may terminate on notice if the other commits a material breach not remedied within thirty (30) days."),
      r("18.3"),
      f("18.5", "Exit assistance", "On expiry or termination the Supplier shall provide the exit assistance set out in Schedule 8."),
    ],
  },
  { number: "19", title: "Dispute resolution", clauses: [f("19.1", "Escalation", "Disputes shall be escalated to the parties’ contract managers and then to their directors before mediation.")] },
  { number: "20", title: "General", clauses: [f("20.1", "Entire agreement", "This Agreement constitutes the entire agreement between the parties."), f("20.2", "Governing law", "This Agreement is governed by the law of England and Wales.")] },
];

const documents: Record<string, DocumentPart[]> = { "mes-imaging": imaging };

/** The whole agreement, if it's held; null means only the extracted clauses are available */
export function documentFor(contractId: string): DocumentPart[] | null {
  return documents[contractId] ?? null;
}
