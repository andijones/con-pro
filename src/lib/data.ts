// Illustrative sample data for the concept. Organisations, suppliers and people are fictional.

export type Person = { id: string; name: string; role: string; initials: string };

export const people: Record<string, Person> = {
  priya: { id: "priya", name: "Priya Shah", role: "Head of Procurement", initials: "PS" },
  tom: { id: "tom", name: "Tom Reilly", role: "Finance Business Partner", initials: "TR" },
  amara: { id: "amara", name: "Dr Amara Okafor", role: "Clinical Director, Diagnostics", initials: "AO" },
  sam: { id: "sam", name: "Sam Whitfield", role: "Information Governance Lead", initials: "SW" },
  helen: { id: "helen", name: "Helen Price", role: "Senior Information Risk Owner", initials: "HP" },
  leon: { id: "leon", name: "Leon Barker", role: "Estates Contract Manager", initials: "LB" },
};

export const currentUser = people.priya;

export const organisation = {
  name: "Northgate Hospitals NHS Foundation Trust",
  short: "Northgate Hospitals",
};

export type Clause = {
  id: string;
  number: string;
  heading: string;
  text: string;
  /** Plain-English reading of what the clause means for the trust */
  plain?: string;
  risk?: "high" | "medium" | "low";
};

export const contractStatuses = [
  "Awaiting upload",
  "Draft",
  "Under review",
  "Legal review",
  "Active",
  "Expired",
  "Terminated",
  "Archived",
  "Deleted",
] as const;
export type ContractStatus = (typeof contractStatuses)[number];

export const contractTypes = ["Clinical", "Estates & Facilities", "Digital", "Pathology", "Corporate"] as const;

export const businessUnits = [
  "Diagnostics",
  "Pathology",
  "Estates",
  "Digital",
  "Surgery",
  "Cardiothoracic",
  "Medicine",
  "Corporate",
] as const;

export type Contract = {
  id: string;
  title: string;
  supplier: string | null;
  category: (typeof contractTypes)[number];
  owner: string | null;
  businessUnit?: string | null;
  reviewDate?: string | null;
  uploaded?: string;
  fileName?: string;
  /** AI extraction state, as in the live platform */
  extraction?: "Reading" | "Ready to review" | "Reviewed";
  status: ContractStatus;
  start: string;
  end: string;
  /** Notice period in days */
  notice: number;
  autoRenew: { months: number } | null;
  annualValue: number | null;
  totalValue: number | null;
  currency?: "GBP" | "USD";
  route: string;
  pages: { held: number; total: number | null };
  clauses: Clause[];
  flags?: string[];
};

const baseContracts: Contract[] = [
  {
    id: "mes-imaging",
    title: "Managed equipment service: imaging",
    supplier: "Halden Medical Systems Ltd",
    category: "Clinical",
    owner: "amara",
    status: "Active",
    start: "2017-04-18",
    end: "2027-04-17",
    notice: 182,
    autoRenew: { months: 12 },
    annualValue: 4_200_000,
    totalValue: 42_000_000,
    route: "Open tender (PCR 2015)",
    pages: { held: 64, total: 64 },
    clauses: [
      {
        id: "1.1",
        number: "1.1",
        heading: "Definitions",
        text: "“Equipment” means the imaging equipment listed in Schedule 2, together with all replacement, upgraded and additional equipment supplied under this Agreement from time to time.",
      },
      {
        id: "3.1",
        number: "3.1",
        heading: "Term",
        text: "This Agreement shall commence on the Commencement Date and shall continue for an Initial Term of ten (10) years, unless terminated earlier in accordance with Clause 18.",
      },
      {
        id: "3.2",
        number: "3.2",
        heading: "Extension",
        text: "Upon expiry of the Initial Term this Agreement shall automatically extend for successive periods of twelve (12) months (each an “Extension Period”) unless either Party gives the other not less than six (6) months’ written notice of its intention not to extend, such notice to expire at the end of the Initial Term or the relevant Extension Period.",
        plain: "Give written notice by 17 October 2026 or the contract renews for another 12 months, worth about £4.2m.",
        risk: "high",
      },
      {
        id: "7.3",
        number: "7.3",
        heading: "Indexation",
        text: "On each anniversary of the Commencement Date the Charges shall be increased by the percentage increase in the Retail Prices Index (RPI) published for the twelve (12) month period ending on the preceding 31 January.",
        plain: "Prices rise every April by the full rate of RPI, with no cap. Last April that was 4.3%, about £173,000.",
        risk: "high",
      },
      {
        id: "9.1",
        number: "9.1",
        heading: "VAT",
        text: "The Charges are exclusive of Value Added Tax. The Supplier shall issue separate invoices for the maintenance element (Schedule 5, Part B) and the equipment provision element (Schedule 5, Part A).",
        plain: "Maintenance is invoiced separately, so the VAT on it may be reclaimable under the contracted-out services rules. Finance should check this.",
        risk: "medium",
      },
      {
        id: "12.4",
        number: "12.4",
        heading: "Uptime and service credits",
        text: "The Supplier shall ensure that each item of Critical Equipment achieves Availability of not less than 98% in each Quarter. Where Availability falls below this level, the Supplier shall credit the Trust 2% of the quarterly Charges for that item for each full percentage point of shortfall, subject to a maximum of 20%.",
        plain: "If a scanner is down more than 2% of a quarter, the trust is owed a credit, up to 20% of that item’s quarterly charge.",
        risk: "low",
      },
      {
        id: "16.2",
        number: "16.2",
        heading: "Limitation of liability",
        text: "Subject to Clause 16.1, the total liability of the Supplier in respect of all claims arising in any Contract Year shall not exceed one hundred and twenty-five per cent (125%) of the Charges paid or payable in that Contract Year.",
        plain: "The supplier’s liability is capped at 125% of a year’s charges, about £5.25m.",
        risk: "low",
      },
      {
        id: "18.3",
        number: "18.3",
        heading: "Termination for convenience",
        text: "The Trust may terminate this Agreement at any time after the fifth anniversary of the Commencement Date by giving not less than twelve (12) months’ written notice, subject to payment of the Termination Sum calculated in accordance with Schedule 9.",
        plain: "The trust can end the contract early with 12 months’ notice, but pays a termination sum set in Schedule 9.",
        risk: "medium",
      },
    ],
  },
  {
    id: "path-reagents",
    title: "Pathology analysers and reagent rental",
    supplier: "Corvel Diagnostics UK Ltd",
    category: "Pathology",
    owner: "amara",
    status: "Active",
    start: "2023-11-01",
    end: "2028-10-31",
    notice: 90,
    autoRenew: null,
    annualValue: 1_100_000,
    totalValue: 5_500_000,
    route: "NHS Supply Chain framework",
    pages: { held: 41, total: 41 },
    clauses: [
      {
        id: "11.4",
        number: "11.4",
        heading: "Price review",
        text: "The Supplier may request a variation to the Charges no more than once in any Contract Year. Any increase shall not exceed the annual change in the Consumer Prices Index (CPI) published by the Office for National Statistics for the month preceding the request.",
        plain: "Annual price rises are capped at CPI, which was 3.8% in August 2026. The supplier has asked for 9.4%.",
        risk: "high",
      },
      {
        id: "11.5",
        number: "11.5",
        heading: "Objection",
        text: "The Trust may object to a proposed variation by written notice within fourteen (14) days of receipt, whereupon the existing Charges shall continue to apply pending resolution under Clause 22.",
        plain: "Object in writing within 14 days of the letter (by 8 October 2026) and current prices stay in place while it’s resolved.",
        risk: "high",
      },
      {
        id: "14.1",
        number: "14.1",
        heading: "Service levels",
        text: "The Supplier shall attend site within four (4) hours of a Priority 1 fault being logged and shall restore service within twenty-four (24) hours.",
        risk: "low",
      },
    ],
  },
  {
    id: "cleaning",
    title: "Domestic and cleaning services",
    supplier: "Brightwell Facilities Services Ltd",
    category: "Estates & Facilities",
    owner: "leon",
    status: "Active",
    start: "2022-07-01",
    end: "2027-06-30",
    notice: 90,
    autoRenew: null,
    annualValue: 2_800_000,
    totalValue: 14_000_000,
    route: "Open tender (PCR 2015)",
    pages: { held: 52, total: 52 },
    clauses: [
      {
        id: "sch1.4",
        number: "Sch 1, 4.2",
        heading: "Theatre linen handling",
        text: "The Contractor shall collect, launder and return all theatre linen and scrubs for Theatres 1–12 at the frequencies set out in Appendix C.",
        plain: "Theatre linen laundry is included here, and also in the Whiteleaf linen contract.",
        risk: "medium",
      },
      {
        id: "8.1",
        number: "8.1",
        heading: "Indexation",
        text: "Charges shall be adjusted annually on 1 July by CPI plus one per cent (1%), capped at five per cent (5%) in aggregate.",
        plain: "Prices rise each July by CPI + 1%, never more than 5%.",
        risk: "low",
      },
    ],
  },
  {
    id: "linen",
    title: "Linen and laundry services",
    supplier: "Whiteleaf Laundry Services Ltd",
    category: "Estates & Facilities",
    owner: "leon",
    status: "Active",
    start: "2024-04-01",
    end: "2027-03-31",
    notice: 60,
    autoRenew: null,
    annualValue: 540_000,
    totalValue: 1_620_000,
    route: "Further competition (framework)",
    pages: { held: 28, total: 28 },
    clauses: [
      {
        id: "sch2.1",
        number: "Sch 2, 1.3",
        heading: "Scope: theatres",
        text: "Services include the supply, collection and laundering of theatre linen, gowns and scrubs for all theatre suites at the Main Site.",
        plain: "Covers theatre linen. The cleaning contract covers the same thing.",
        risk: "medium",
      },
    ],
  },
  {
    id: "epr",
    title: "Electronic patient record licence and support",
    supplier: "Meridian Health Software Ltd",
    category: "Digital",
    owner: "priya",
    status: "Active",
    start: "2021-04-01",
    end: "2028-03-31",
    notice: 180,
    autoRenew: null,
    annualValue: 1_600_000,
    totalValue: null,
    route: "G-Cloud 12",
    pages: { held: 20, total: 84 },
    flags: ["Only pages 1–20 of 84 are held. The charges schedule is probably in the missing part."],
    clauses: [
      {
        id: "2.1",
        number: "2.1",
        heading: "Licence",
        text: "The Supplier grants the Buyer a non-exclusive, non-transferable licence to use the Software for up to 6,500 Named Users for the Term.",
        risk: "low",
      },
    ],
  },
  {
    id: "vaccine-cold-chain",
    title: "Vaccine fridge temperature monitoring",
    supplier: "Polar Assure Ltd",
    category: "Clinical",
    owner: "amara",
    status: "Active",
    start: "2024-11-15",
    end: "2026-11-15",
    notice: 30,
    autoRenew: { months: 24 },
    annualValue: 48_000,
    totalValue: 96_000,
    route: "Direct award (below threshold)",
    pages: { held: 14, total: 14 },
    clauses: [
      {
        id: "5.2",
        number: "5.2",
        heading: "Renewal",
        text: "This Agreement renews automatically for a further twenty-four (24) months unless the Customer gives thirty (30) days’ notice prior to the Renewal Date.",
        plain: "Give notice by 16 October 2026 or it renews for two years.",
        risk: "medium",
      },
      {
        id: "9.1",
        number: "9.1",
        heading: "Liability for stock loss",
        text: "The Supplier shall not be liable for any loss of or damage to stock, including vaccines and medicines, howsoever arising, save where caused by the Supplier’s gross negligence.",
        plain: "If a fridge fails and vaccines are lost, the supplier only pays if it was grossly negligent. The trust carries most of that risk.",
        risk: "high",
      },
    ],
  },
  {
    id: "patient-transport",
    title: "Non-emergency patient transport",
    supplier: "Medline Patient Transport Ltd",
    category: "Clinical",
    owner: "priya",
    status: "Active",
    start: "2023-10-01",
    end: "2027-09-30",
    notice: 180,
    autoRenew: null,
    annualValue: 3_400_000,
    totalValue: 13_600_000,
    route: "Provider Selection Regime: competitive process",
    pages: { held: 70, total: 70 },
    clauses: [],
  },
  {
    id: "clinical-waste",
    title: "Clinical and hazardous waste collection",
    supplier: "Greenway Clinical Waste Ltd",
    category: "Estates & Facilities",
    owner: "leon",
    status: "Active",
    start: "2021-11-01",
    end: "2026-10-31",
    notice: 90,
    autoRenew: null,
    annualValue: 620_000,
    totalValue: 3_100_000,
    route: "Open tender (PCR 2015)",
    pages: { held: 33, total: 33 },
    clauses: [
      {
        id: "3.1",
        number: "3.1",
        heading: "Term",
        text: "The Contract shall run from the Commencement Date until 31 October 2026. No further extension is provided for.",
        plain: "The contract ends on 31 October 2026 and can’t be extended. No replacement is recorded.",
        risk: "high",
      },
    ],
  },
  {
    id: "catering",
    title: "Patient and staff catering",
    supplier: "Hearth & Table Catering Ltd",
    category: "Estates & Facilities",
    owner: "leon",
    status: "Active",
    start: "2025-01-01",
    end: "2029-12-31",
    notice: 180,
    autoRenew: null,
    annualValue: 1_900_000,
    totalValue: 9_500_000,
    route: "Open procedure (Procurement Act 2023)",
    pages: { held: 58, total: 58 },
    clauses: [],
  },
  {
    id: "desktop-support",
    title: "Desktop and service desk support",
    supplier: "Northpoint IT Services Ltd",
    category: "Digital",
    owner: "priya",
    status: "Active",
    start: "2025-06-01",
    end: "2028-05-31",
    notice: 90,
    autoRenew: null,
    annualValue: 890_000,
    totalValue: 2_670_000,
    currency: "USD",
    route: "Further competition (framework)",
    pages: { held: 36, total: 36 },
    flags: ["Values are in US dollars, which is unusual for a UK public body. Check before quoting."],
    clauses: [],
  },
  {
    id: "endoscopy-decon",
    title: "Endoscopy decontamination service",
    supplier: null,
    category: "Clinical",
    owner: "amara",
    status: "Draft",
    start: "2027-01-01",
    end: "2031-12-31",
    notice: 180,
    autoRenew: null,
    annualValue: null,
    totalValue: 2_350_000,
    route: "Provider Selection Regime: direct award C",
    pages: { held: 22, total: 22 },
    flags: ["No supplier recorded.", "Still a draft. May fall under section 22 if requested under FOI."],
    clauses: [],
  },
  {
    id: "mri-mobile",
    title: "Mobile MRI scanner hire",
    supplier: "Halden Medical Systems Ltd",
    category: "Clinical",
    owner: "amara",
    status: "Active",
    start: "2025-09-01",
    end: "2027-08-31",
    notice: 60,
    autoRenew: null,
    annualValue: 720_000,
    totalValue: 1_440_000,
    route: "Direct award (framework)",
    pages: { held: 19, total: 19 },
    clauses: [],
  },
  {
    id: "telecoms",
    title: "Telephony and unified communications",
    supplier: "Quayside Telecom Ltd",
    category: "Digital",
    owner: "priya",
    status: "Active",
    start: "2024-02-01",
    end: "2027-01-31",
    notice: 90,
    autoRenew: { months: 12 },
    annualValue: 310_000,
    totalValue: 930_000,
    route: "G-Cloud 13",
    pages: { held: 24, total: 24 },
    clauses: [],
  },
];

/* Platform metadata: business unit, review date, upload record */
const meta: Record<string, Partial<Contract>> = {
  "mes-imaging": { businessUnit: "Diagnostics", reviewDate: "2026-10-10", uploaded: "2026-08-04", extraction: "Reviewed" },
  "path-reagents": { businessUnit: "Pathology", reviewDate: "2026-10-06", uploaded: "2026-08-04", extraction: "Reviewed" },
  cleaning: { businessUnit: "Estates", reviewDate: "2027-01-15", uploaded: "2026-08-11", extraction: "Reviewed" },
  linen: { businessUnit: "Estates", reviewDate: null, uploaded: "2026-09-30", extraction: "Reviewed" },
  epr: { businessUnit: "Digital", reviewDate: "2026-11-01", uploaded: "2026-08-19", extraction: "Reviewed" },
  "vaccine-cold-chain": { businessUnit: "Medicine", reviewDate: "2026-10-09", uploaded: "2026-08-21", extraction: "Reviewed" },
  "patient-transport": { businessUnit: "Corporate", reviewDate: "2026-11-20", uploaded: "2026-08-21", extraction: "Reviewed" },
  "clinical-waste": { businessUnit: "Estates", reviewDate: null, uploaded: "2026-08-25", extraction: "Reviewed" },
  catering: { businessUnit: "Estates", reviewDate: null, uploaded: "2026-09-02", extraction: "Reviewed" },
  "desktop-support": { businessUnit: "Digital", reviewDate: null, uploaded: "2026-09-02", extraction: "Reviewed" },
  "endoscopy-decon": { businessUnit: "Surgery", reviewDate: "2026-10-30", uploaded: "2026-09-15", extraction: "Reviewed" },
  "mri-mobile": { businessUnit: "Diagnostics", reviewDate: null, uploaded: "2026-09-08", extraction: "Reviewed" },
  telecoms: { businessUnit: "Digital", reviewDate: null, uploaded: "2026-09-08", extraction: "Reviewed" },
};

const workspaceOnly: Contract[] = [
  {
    id: "locum-rpo",
    title: "Locum recruitment process outsourcing",
    fileName: "QX_Locum_RPO_Services_25.09.pdf",
    supplier: null,
    category: "Clinical",
    owner: null,
    businessUnit: null,
    status: "Draft",
    extraction: "Ready to review",
    uploaded: "2026-09-30",
    start: "2026-10-01",
    end: "2028-09-30",
    notice: 90,
    autoRenew: null,
    annualValue: null,
    totalValue: null,
    route: "Not recorded",
    pages: { held: 12, total: 12 },
    clauses: [],
  },
  {
    id: "tray-tracking",
    title: "Theatre instrument tray tracking",
    fileName: "tray-sweep.pdf",
    supplier: null,
    category: "Clinical",
    owner: null,
    businessUnit: null,
    status: "Draft",
    extraction: "Reading",
    uploaded: "2026-09-21",
    start: "2026-11-01",
    end: "2029-10-31",
    notice: 90,
    autoRenew: null,
    annualValue: null,
    totalValue: null,
    route: "Not recorded",
    pages: { held: 9, total: 9 },
    clauses: [],
  },
  {
    id: "sterile-services",
    title: "Sterile services decontamination",
    fileName: "Sterile_Services_First_20_Pages.pdf",
    supplier: null,
    category: "Clinical",
    owner: null,
    businessUnit: null,
    status: "Draft",
    extraction: "Ready to review",
    uploaded: "2026-09-15",
    start: "2025-04-01",
    end: "2030-03-31",
    notice: 180,
    autoRenew: null,
    annualValue: null,
    totalValue: null,
    route: "Not recorded",
    pages: { held: 20, total: 96 },
    flags: ["Only the first 20 pages are held."],
    clauses: [],
  },
  {
    id: "agency-nursing",
    title: "Agency nursing call-off",
    fileName: "Agency_Nursing_CallOff.pdf",
    supplier: "Patchwell Staffing Ltd",
    category: "Clinical",
    owner: "amara",
    businessUnit: "Cardiothoracic",
    status: "Terminated",
    extraction: "Reviewed",
    uploaded: "2026-09-15",
    start: "2024-04-01",
    end: "2026-09-30",
    notice: 30,
    autoRenew: null,
    annualValue: 410_000,
    totalValue: 820_000,
    route: "Framework call-off",
    pages: { held: 18, total: 18 },
    clauses: [],
  },
  {
    id: "car-parking",
    title: "Car park management",
    fileName: "Car_Park_Management_v3.pdf",
    supplier: "Kerbside Parking Services Ltd",
    category: "Estates & Facilities",
    owner: "leon",
    businessUnit: "Estates",
    status: "Under review",
    extraction: "Reviewed",
    uploaded: "2026-09-26",
    start: "2026-12-01",
    end: "2031-11-30",
    notice: 180,
    autoRenew: null,
    annualValue: 260_000,
    totalValue: 1_300_000,
    route: "Concession",
    pages: { held: 31, total: 31 },
    clauses: [],
  },
  {
    id: "interpreting",
    title: "Interpreting and translation services",
    fileName: "Interpreting_Services_Final.pdf",
    supplier: "Clearvoice Language Services Ltd",
    category: "Corporate",
    owner: "priya",
    businessUnit: "Corporate",
    status: "Legal review",
    extraction: "Reviewed",
    uploaded: "2026-09-24",
    start: "2026-11-01",
    end: "2029-10-31",
    notice: 90,
    autoRenew: null,
    annualValue: 185_000,
    totalValue: 555_000,
    route: "Further competition (framework)",
    pages: { held: 26, total: 26 },
    clauses: [],
  },
  {
    id: "print-managed",
    title: "Managed print service",
    fileName: "Managed_Print_2021.pdf",
    supplier: "Inkwell Office Solutions Ltd",
    category: "Digital",
    owner: "priya",
    businessUnit: "Digital",
    status: "Expired",
    extraction: "Reviewed",
    uploaded: "2026-08-04",
    start: "2021-09-01",
    end: "2026-08-31",
    notice: 90,
    autoRenew: null,
    annualValue: 140_000,
    totalValue: 700_000,
    route: "Framework call-off",
    pages: { held: 22, total: 22 },
    clauses: [],
  },
  {
    id: "courier-archive",
    title: "Specimen courier (2019–2023)",
    fileName: "Courier_2019.pdf",
    supplier: "Swiftbox Couriers Ltd",
    category: "Pathology",
    owner: "amara",
    businessUnit: "Pathology",
    status: "Archived",
    extraction: "Reviewed",
    uploaded: "2026-08-04",
    start: "2019-04-01",
    end: "2023-03-31",
    notice: 30,
    autoRenew: null,
    annualValue: 95_000,
    totalValue: 380_000,
    route: "Quotation",
    pages: { held: 11, total: 11 },
    clauses: [],
  },
  ...["Test upload (duplicate)", "Old scan, illegible", "Wrong trust's contract"].map(
    (title, i): Contract => ({
      id: `deleted-${i}`,
      title,
      supplier: null,
      category: "Corporate",
      owner: null,
      status: "Deleted",
      uploaded: "2026-08-12",
      start: "2026-01-01",
      end: "2026-12-31",
      notice: 0,
      autoRenew: null,
      annualValue: null,
      totalValue: null,
      route: "Not recorded",
      pages: { held: 1, total: 1 },
      clauses: [],
    }),
  ),
];

/** Every contract in the workspace, deleted included (as the live platform counts them) */
export const workspace: Contract[] = [
  ...baseContracts.map((c) => ({ fileName: `${c.title.replace(/[^a-z0-9]+/gi, "_")}.pdf`, ...c, ...meta[c.id] })),
  ...workspaceOnly,
];

/** The contracts anyone can still act on */
export const contracts: Contract[] = workspace.filter((c) => c.status !== "Deleted");

/** Contracts that run the decision engine: live or about to be */
export const liveContracts = contracts.filter((c) => ["Active", "Draft", "Under review", "Legal review"].includes(c.status) && c.extraction === "Reviewed");

export function getContract(id: string) {
  return contracts.find((c) => c.id === id);
}

/* ---------- Decisions: the core of the "Today" view ---------- */

export type DecisionKind = "notice" | "price" | "money" | "gap" | "procurement";

export type Decision = {
  id: string;
  contractId: string;
  kind: DecisionKind;
  /** Plain-English action, phrased as what happens if nobody acts */
  title: string;
  detail: string;
  due: string;
  dueLabel: string;
  /** Money at stake, if it can be stated honestly */
  impact?: { amount: number; label: string };
  clauseId?: string;
  owner: string;
  actions: { primary: string; secondary?: string };
};

export const decisions: Decision[] = [
  {
    id: "d-path-uplift",
    contractId: "path-reagents",
    kind: "price",
    title: "Object to Corvel’s 9.4% price rise",
    detail:
      "Corvel has asked for a 9.4% rise from 1 November. Clause 11.4 caps rises at CPI, which is 3.8%. If you object in writing by 8 October, current prices stay in place.",
    due: "2026-10-08",
    dueLabel: "Objection window closes",
    impact: { amount: 61_600, label: "a year over the CPI cap" },
    clauseId: "11.5",
    owner: "priya",
    actions: { primary: "Draft objection letter", secondary: "Assign" },
  },
  {
    id: "d-vaccine-renewal",
    contractId: "vaccine-cold-chain",
    kind: "notice",
    title: "Decide on vaccine fridge monitoring before it renews for two years",
    detail:
      "Renews automatically on 15 November unless notice is given 30 days before. Clause 9.1 also leaves the trust carrying almost all of the risk if stock is lost.",
    due: "2026-10-16",
    dueLabel: "Notice deadline",
    impact: { amount: 96_000, label: "committed if it renews" },
    clauseId: "5.2",
    owner: "amara",
    actions: { primary: "Review renewal", secondary: "Assign" },
  },
  {
    id: "d-mes-notice",
    contractId: "mes-imaging",
    kind: "notice",
    title: "Give notice on the imaging contract, or let it renew for 12 months",
    detail:
      "Clause 3.2 needs six months’ written notice before 17 April 2027. If nobody acts it extends to April 2028, and prices rise again by the full rate of RPI with no cap.",
    due: "2026-10-17",
    dueLabel: "Notice deadline",
    impact: { amount: 4_200_000, label: "committed if it renews" },
    clauseId: "3.2",
    owner: "amara",
    actions: { primary: "Prepare decision paper", secondary: "Assign" },
  },
  {
    id: "d-waste-gap",
    contractId: "clinical-waste",
    kind: "procurement",
    title: "Clinical waste collection ends on 31 October with no replacement",
    detail:
      "Clause 3.1 doesn’t allow an extension, and no new contract or tender is recorded. You need a way to keep collections running after 31 October.",
    due: "2026-10-31",
    dueLabel: "Contract ends",
    clauseId: "3.1",
    owner: "leon",
    actions: { primary: "Find a route", secondary: "Assign" },
  },
  {
    id: "d-mes-vat",
    contractId: "mes-imaging",
    kind: "money",
    title: "Reclaim VAT on imaging maintenance",
    detail:
      "Maintenance is invoiced separately under clause 9.1 and may count as a contracted-out service. The oldest claimable period runs out on 31 October.",
    due: "2026-10-31",
    dueLabel: "Oldest period expires",
    impact: { amount: 186_000, label: "estimated, needs Finance to confirm" },
    clauseId: "9.1",
    owner: "tom",
    actions: { primary: "Send to Finance", secondary: "Not applicable" },
  },
  {
    id: "d-linen-dup",
    contractId: "linen",
    kind: "money",
    title: "Theatre linen is paid for twice",
    detail:
      "Both the Whiteleaf linen contract and the Brightwell cleaning contract cover theatre linen for the main site. Ask one supplier to remove it at the next variation.",
    due: "2026-12-31",
    dueLabel: "Next variation window",
    impact: { amount: 38_400, label: "a year, estimated" },
    clauseId: "sch2.1",
    owner: "leon",
    actions: { primary: "Compare the two clauses", secondary: "Dismiss" },
  },
  {
    id: "d-epr-gap",
    contractId: "epr",
    kind: "gap",
    title: "Only 20 of the 84 EPR contract pages are held",
    detail:
      "The charges schedule and termination terms are probably in the missing pages. Until they’re uploaded, value and exit questions about this contract can’t be answered.",
    due: "2026-11-15",
    dueLabel: "Requested by",
    owner: "priya",
    actions: { primary: "Upload full document", secondary: "Assign" },
  },
  {
    id: "d-transport-psr",
    contractId: "patient-transport",
    kind: "procurement",
    title: "Choose a PSR route for patient transport",
    detail:
      "The contract ends on 30 September 2027. A competitive process needs about 9 months, so the route should be agreed by 1 December 2026.",
    due: "2026-12-01",
    dueLabel: "Decision needed by",
    impact: { amount: 3_400_000, label: "a year" },
    owner: "priya",
    actions: { primary: "Compare routes", secondary: "Assign" },
  },
];

/* ---------- FOI ---------- */

export type FoiStatus = "New" | "Searching" | "Awaiting clarification" | "Confirm scope" | "Draft ready" | "With reviewer" | "Sent";

export type FoiRequest = {
  id: string;
  ref: string;
  received: string;
  requester: string;
  subject: string;
  text: string;
  status: FoiStatus;
  /** The officer who handles it and drafts the reply */
  assignee: string;
  /** Who signs the reply off. Never the officer who drafted it (separation of duties). */
  reviewer: string;
  /** Asked the requester to clarify on this date: the clock stops (FOI Act s.1(3)) */
  clarifyAsked?: string;
  /** Who approved the reply, once signed off */
  approvedBy?: string;
  /** The date the reply went out: stops the clock */
  sentOn?: string;
};

export const foiRequests: FoiRequest[] = [
  {
    id: "foi-0398",
    ref: "FOI-2026-0398",
    received: "2026-09-03",
    requester: "Member of the public",
    subject: "Copies of IT support contracts",
    text: "Please send copies of all current contracts for IT support and service desk services, including any schedules setting out prices.",
    status: "With reviewer",
    assignee: "sam",
    reviewer: "helen",
  },
  {
    id: "foi-0412",
    ref: "FOI-2026-0412",
    received: "2026-09-17",
    requester: "Journalist",
    subject: "Annual value of clinical contracts",
    text: "Please provide the total annual value of all Clinical contracts currently held by the Trust, broken down by supplier, together with the end date of each contract.",
    status: "Draft ready",
    assignee: "sam",
    reviewer: "helen",
  },
  {
    id: "foi-0419",
    ref: "FOI-2026-0419",
    received: "2026-09-24",
    requester: "Supplier",
    subject: "Cleaning contract end date and supplier",
    text: "Could you tell me who currently provides cleaning services to the Trust, when that contract ends, and whether you intend to re-tender it?",
    status: "Confirm scope",
    assignee: "sam",
    reviewer: "helen",
  },
  {
    id: "foi-0425",
    ref: "FOI-2026-0425",
    received: "2026-09-30",
    requester: "Campaign group",
    subject: "Spend on patient transport",
    text: "How much has the Trust spent on non-emergency patient transport in each of the last three financial years, and who is the provider?",
    status: "New",
    assignee: "sam",
    reviewer: "helen",
  },
];

export function getFoi(id: string) {
  return foiRequests.find((f) => f.id === id);
}

/* ---------- Audit ---------- */

export type AuditEvent = {
  at: string; // ISO datetime
  who: string;
  what: string;
  target: string;
  href?: string;
  /** Contravo staff must give a reason for anything they do in a workspace */
  staff?: { name: string; reason: string };
};

export const audit: AuditEvent[] = [
  { at: "2026-10-01T08:42:00Z", who: "sam", what: "opened the draft response for", target: "FOI-2026-0412", href: "/foi/foi-0412" },
  { at: "2026-10-01T08:15:00Z", who: "system", what: "flagged a price rise above the CPI cap on", target: "Pathology analysers and reagent rental", href: "/contracts/path-reagents" },
  { at: "2026-09-30T16:20:00Z", who: "tom", what: "viewed clause 9.1 (VAT) on", target: "Managed equipment service: imaging", href: "/contracts/mes-imaging?clause=9.1" },
  { at: "2026-09-30T14:02:00Z", who: "priya", what: "assigned the imaging notice decision to", target: "Dr Amara Okafor" },
  { at: "2026-09-30T11:47:00Z", who: "leon", what: "uploaded", target: "Linen and laundry services (28 pages)", href: "/contracts/linen" },
  { at: "2026-09-29T15:30:00Z", who: "system", what: "found theatre linen paid for twice across", target: "2 contracts", href: "/contracts/linen" },
  { at: "2026-09-29T10:05:00Z", who: "sam", what: "confirmed the scope (6 contracts) for", target: "FOI-2026-0412", href: "/foi/foi-0412" },
  { at: "2026-09-28T09:12:00Z", who: "amara", what: "asked", target: "“Who pays if the vaccine fridge fails?”", href: "/chat?q=Who%20pays%20if%20the%20vaccine%20fridge%20fails%3F" },
  { at: "2026-09-30T14:29:00Z", who: "system", what: "finished reading", target: "QX_Locum_RPO_Services_25.09.pdf (9 fields)", href: "/contracts/locum-rpo/review" },
  { at: "2026-09-30T14:28:00Z", who: "priya", what: "uploaded", target: "QX_Locum_RPO_Services_25.09.pdf", href: "/contracts/locum-rpo/review" },
  { at: "2026-09-30T13:51:00Z", who: "priya", what: "submitted for review", target: "Car park management", href: "/contracts/car-parking" },
  { at: "2026-09-30T13:43:00Z", who: "priya", what: "assigned Leon Barker as owner of", target: "Car park management", href: "/contracts/car-parking" },
  { at: "2026-09-29T17:05:00Z", who: "amara", what: "terminated", target: "Agency nursing call-off", href: "/contracts/agency-nursing" },
  {
    at: "2026-09-29T12:10:00Z",
    who: "staff",
    what: "re-ran extraction on",
    target: "Sterile_Services_First_20_Pages.pdf",
    href: "/contracts/sterile-services/review",
    staff: { name: "Harry Davis (Contravo)", reason: "The trust reported a scanned page that came out unreadable. Re-ran text recognition with their permission." },
  },
  { at: "2026-09-28T16:40:00Z", who: "leon", what: "corrected the end date on", target: "Domestic and cleaning services", href: "/contracts/cleaning" },
  { at: "2026-09-28T11:02:00Z", who: "priya", what: "deleted", target: "Test upload (duplicate)" },
];

/* ---------- Chat history (sidebar "Recent conversations") ---------- */

export const conversations = [
  { id: "c1", title: "Who pays if the vaccine fridge fails?", q: "Who pays if the vaccine fridge fails?", at: "2026-09-28" },
  { id: "c2", title: "Which contracts renew automatically?", q: "Which contracts renew automatically?", at: "2026-09-25" },
  { id: "c3", title: "Price rises across our contracts", q: "How do prices rise across our contracts?", at: "2026-09-22" },
  { id: "c4", title: "Theatre linen overlap", q: "Are we paying for anything twice?", at: "2026-09-19" },
];
