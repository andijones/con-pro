import { getContract, type Contract } from "./data";
import { formatDate, gbp } from "./dates";

export type FieldGroup = "General" | "Parties" | "Key dates" | "Financial";

export type ExtractedField = {
  key: string;
  label: string;
  group: FieldGroup;
  required?: boolean;
  /** What the AI read. null = not found in the document. */
  value: string | null;
  /** 0–100 */
  confidence: number;
  /** Where it was read from */
  page?: number;
  quote?: string;
  /** When the AI found nothing, what it found nearby (never auto-filled) */
  suggestion?: { value: string; why: string; page: number };
  long?: boolean;
  history?: { at: string; who: string; value: string | null }[];
};

export type DocBlock =
  | { kind: "title"; text: string }
  | { kind: "h"; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string }
  | { kind: "table"; head: string[]; rows: string[][] };

export type DocPage = { number: number; label?: string; blocks: DocBlock[] };

/* ---------- Locum RPO: mirrors the live platform's test document ---------- */

const rpoPages: DocPage[] = [
  {
    number: 1,
    blocks: [
      { kind: "title", text: "SERVICES AGREEMENT" },
      { kind: "h", text: "RPO SERVICES" },
      { kind: "p", text: "THIS AGREEMENT is dated ____________ 2026" },
      { kind: "p", text: "BETWEEN" },
      { kind: "p", text: "(1) QUOREX RECRUITMENT SERVICES LIMITED, a company registered in England and Wales (the “Service Provider”); and" },
      { kind: "p", text: "(2) NORTHGATE HOSPITALS NHS FOUNDATION TRUST (the “Client”)." },
    ],
  },
  {
    number: 2,
    blocks: [
      { kind: "h", text: "1. Definitions" },
      { kind: "p", text: "“Commencement Date” means the date on which this Agreement is signed by both Parties." },
      { kind: "p", text: "“FTE” means a full-time equivalent recruiter working 160 hours per calendar month." },
      { kind: "p", text: "“Services” means the recruitment process outsourcing services described in Schedule 1." },
    ],
  },
  {
    number: 3,
    blocks: [
      { kind: "h", text: "2. Term" },
      {
        kind: "p",
        text: "This Agreement shall commence on the Commencement Date and shall continue for a period of twenty-four (24) months, unless terminated earlier in accordance with Clause 9.",
      },
    ],
  },
  {
    number: 4,
    blocks: [
      { kind: "h", text: "3. The Services" },
      {
        kind: "p",
        text: "The Service Provider shall provide recruitment services to the Client, including the sourcing, screening and booking of locum medical staff, shift reconciliation, and booking modification and cancellation, as set out in Schedule 1.",
      },
      { kind: "p", text: "The Services are provided on an outsourced basis. Service Provider personnel remain employees of the Service Provider." },
    ],
  },
  {
    number: 5,
    blocks: [
      { kind: "h", text: "4. Charges" },
      { kind: "p", text: "The Client shall pay the Charges set out in Schedule 3 monthly in arrears." },
      {
        kind: "p",
        text: "For the purposes of costs incurred in Indian Rupees, the exchange rate is fixed at 102 Indian Rupees to £1 Sterling, reset on the first day of completion of every twelve months.",
      },
    ],
  },
  {
    number: 6,
    blocks: [
      { kind: "h", text: "5. Data protection" },
      {
        kind: "p",
        text: "Each Party shall comply with the UK GDPR and the Data Protection Act 2018. The Service Provider acts as Processor on behalf of the Client in respect of candidate personal data.",
      },
    ],
  },
  { number: 7, blocks: [{ kind: "h", text: "6. Personnel" }, { kind: "p", text: "Working hours exceeding 160 hours per month per FTE are subject to overtime at 1.5 times the pro-rata rate." }] },
  { number: 8, blocks: [{ kind: "h", text: "7. Liability" }, { kind: "p", text: "Neither Party limits its liability for death or personal injury caused by its negligence." }] },
  {
    number: 9,
    blocks: [
      { kind: "h", text: "9. Termination" },
      { kind: "p", text: "Either Party may terminate this Agreement by giving not less than ninety (90) days’ written notice to the other." },
    ],
  },
  {
    number: 10,
    label: "Schedule 1",
    blocks: [
      { kind: "h", text: "SCHEDULE 1: SERVICES" },
      { kind: "li", text: "Sourcing and screening of locum doctors" },
      { kind: "li", text: "Shift reconciliation" },
      { kind: "li", text: "Booking modification and cancellation" },
    ],
  },
  {
    number: 11,
    label: "Schedule 2",
    blocks: [
      { kind: "h", text: "SCHEDULE 2: SERVICE LEVELS" },
      { kind: "li", text: "Booking modification" },
      { kind: "li", text: "Booking cancellation" },
      { kind: "h", text: "Note: Ramp-up of resources" },
      {
        kind: "p",
        text: "In case the Client wishes to ramp up resources during the term of this Agreement, the Client shall provide email confirmation stating the increase in the number of resources along with agreed commercials, or the same can be carried out by way of Addendum. Any replacement of FTE is charged at £250 per FTE, except for the first 6 months from initial on-boarding.",
      },
    ],
  },
  {
    number: 12,
    label: "Schedule 3",
    blocks: [
      { kind: "h", text: "SCHEDULE 3: FEES" },
      { kind: "p", text: "Recruitment service fees" },
      {
        kind: "table",
        head: ["Role", "Cost per FTE per month", "No. of FTE", "Total fees (monthly)", "Total fees (yearly)"],
        rows: [["Recruiter", "£1,100", "2", "£2,200", "£26,400"]],
      },
    ],
  },
];

const rpoFields: ExtractedField[] = [
  {
    key: "name",
    label: "Contract name",
    group: "General",
    required: true,
    value: "RPO Services",
    confidence: 22,
    page: 1,
    quote: "RPO SERVICES",
    history: [{ at: "2026-09-30T14:28:00Z", who: "system", value: "RPO SERVICES" }],
  },
  {
    key: "description",
    label: "Contract description",
    group: "General",
    value:
      "Recruitment process outsourcing between Quorex Recruitment Services Limited (service provider) and the trust, covering locum sourcing, shift reconciliation, booking modification and cancellation, with GDPR processing terms.",
    confidence: 57,
    page: 4,
    quote: "The Service Provider shall provide recruitment services to the Client",
    long: true,
  },
  {
    key: "special",
    label: "Special terms",
    group: "General",
    value:
      "Ramp-up of resources needs email confirmation or an addendum. Replacing an FTE costs £250, except in the first 6 months. Hours above 160 a month are charged as overtime at 1.5×. Exchange rate fixed at 102 Indian Rupees to £1, reset every 12 months.",
    confidence: 30,
    page: 11,
    quote: "Any replacement of FTE is charged at £250 per FTE",
    long: true,
  },
  { key: "sourcing", label: "Insourcing vs outsourcing", group: "General", value: "Outsourcing", confidence: 56, page: 4, quote: "provided on an outsourced basis" },
  {
    key: "counterparty",
    label: "Counterparty",
    group: "Parties",
    value: "Quorex Recruitment Services Limited",
    confidence: 91,
    page: 1,
    quote: "QUOREX RECRUITMENT SERVICES LIMITED",
  },
  {
    key: "start",
    label: "Start date",
    group: "Key dates",
    value: null,
    confidence: 42,
    page: 1,
    quote: "dated ____________ 2026",
    suggestion: { value: "Date of signature", why: "The start date is the signature date, and the date on page 1 is blank.", page: 2 },
  },
  {
    key: "end",
    label: "End date",
    group: "Key dates",
    value: null,
    confidence: 58,
    page: 3,
    quote: "continue for a period of twenty-four (24) months",
    suggestion: { value: "24 months after signature", why: "The term is given as a length, not a date. Add the signature date to work it out.", page: 3 },
  },
  {
    key: "notice",
    label: "Notice period",
    group: "Key dates",
    value: "90 days",
    confidence: 88,
    page: 9,
    quote: "not less than ninety (90) days’ written notice",
  },
  {
    key: "value",
    label: "Estimated total contract value",
    group: "Financial",
    value: null,
    confidence: 0,
    page: 12,
    suggestion: {
      value: "£52,800",
      why: "Schedule 3 gives £26,400 a year for 2 recruiters. Over 24 months that’s £52,800, before overtime, replacements or ramp-up.",
      page: 12,
    },
  },
];

/* ---------- Generic: derived from contract data for anything else ---------- */

function genericPages(c: Contract): DocPage[] {
  const pages: DocPage[] = [
    {
      number: 1,
      blocks: [
        { kind: "title", text: "AGREEMENT" },
        { kind: "h", text: c.title.toUpperCase() },
        { kind: "p", text: `BETWEEN (1) ${c.supplier?.toUpperCase() ?? "[SUPPLIER]"} and (2) NORTHGATE HOSPITALS NHS FOUNDATION TRUST.` },
      ],
    },
  ];
  c.clauses.forEach((k, i) =>
    pages.push({ number: i + 2, blocks: [{ kind: "h", text: `${k.number} ${k.heading}` }, { kind: "p", text: k.text }] }),
  );
  while (pages.length < Math.min(c.pages.held, 8)) {
    pages.push({ number: pages.length + 1, blocks: [{ kind: "p", text: "[Page text not shown in this concept]" }] });
  }
  return pages;
}

function genericFields(c: Contract): ExtractedField[] {
  return [
    { key: "name", label: "Contract name", group: "General", required: true, value: c.title, confidence: 94, page: 1, quote: c.title.toUpperCase() },
    { key: "counterparty", label: "Counterparty", group: "Parties", value: c.supplier, confidence: c.supplier ? 89 : 0, page: 1 },
    { key: "start", label: "Start date", group: "Key dates", value: formatDate(c.start), confidence: 82, page: 2 },
    { key: "end", label: "End date", group: "Key dates", value: formatDate(c.end), confidence: 78, page: 2 },
    { key: "notice", label: "Notice period", group: "Key dates", value: `${c.notice} days`, confidence: 74, page: 2 },
    {
      key: "value",
      label: "Estimated total contract value",
      group: "Financial",
      value: c.totalValue ? gbp(c.totalValue) : null,
      confidence: c.totalValue ? 66 : 0,
      page: 3,
    },
  ];
}

export function extractionFor(id: string) {
  const c = getContract(id);
  if (!c) return null;
  if (id === "locum-rpo") return { contract: c, fields: rpoFields, pages: rpoPages };
  return { contract: c, fields: genericFields(c), pages: genericPages(c) };
}
