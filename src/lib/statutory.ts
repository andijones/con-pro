/**
 * Statutory publications for an NHS trust: what it must publish, the rule behind each one, and what is due next.
 * Sources (checked 7 October 2026):
 * - Procurement Act 2023 and the Procurement Regulations 2024 (GOV.UK short guide, "New legislative requirements")
 * - Health Care Services (Provider Selection Regime) Regulations 2023, regulation 25
 * - HM Treasury transparency guidance: NHS bodies publish spend over £25,000 monthly
 * Health care services bought under the PSR are outside the Procurement Act; goods and non-clinical services are inside it.
 * Decision record: docs/decisions/reports.md
 */
import { contracts, type Contract } from "./data";
import { TODAY, formatDate } from "./dates";

export type Duty = {
  id: string;
  title: string;
  rule: string;
  appliesTo: string;
  cadence: string;
  deadline: string;
  contains: string;
};

export const duties: Duty[] = [
  {
    id: "spend",
    title: "Spend over £25,000",
    rule: "HM Treasury transparency guidance",
    appliesTo: "All NHS bodies",
    cadence: "Monthly",
    deadline: "Each month, for the month before",
    contains: "Every invoice, grant or expense payment over £25,000. Salaries and recoverable VAT are left out.",
  },
  {
    id: "payments-compliance",
    title: "Payments compliance notice",
    rule: "Procurement Act 2023, s.69",
    appliesTo: "All contracting authorities",
    cadence: "Every 6 months (April to September, October to March)",
    deadline: "Within 30 days of the period ending",
    contains: "Average days taken to pay suppliers, and the share paid within 30 days, 31 to 60 days and after 60 days.",
  },
  {
    id: "payments-30k",
    title: "Payments over £30,000",
    rule: "Procurement Act 2023, s.70",
    appliesTo: "Public contracts procured on or after 1 April 2026",
    cadence: "Quarterly",
    deadline: "Within 30 days of the quarter ending",
    contains: "Each payment over £30,000 including VAT: the supplier, the amount and the date.",
  },
  {
    id: "contract-details",
    title: "Contract details notice",
    rule: "Procurement Act 2023, s.53",
    appliesTo: "Each public contract awarded under the Act",
    cadence: "Once per contract",
    deadline: "Within 30 days of signing (120 for light-touch contracts)",
    contains: "The key details of the contract. Over £5m, a copy of the contract is published too.",
  },
  {
    id: "performance",
    title: "Contract performance notice",
    rule: "Procurement Act 2023, s.71",
    appliesTo: "Contracts over £5m under the Act",
    cadence: "At least every 12 months, and when the contract ends",
    deadline: "Also within 30 days of a breach or poor performance",
    contains: "Performance against at least three key performance indicators set at award.",
  },
  {
    id: "pipeline",
    title: "Pipeline notice",
    rule: "Procurement Act 2023, s.93",
    appliesTo: "Authorities expecting to pay over £100m in the year",
    cadence: "Yearly",
    deadline: "Within 56 days of 1 April",
    contains: "Contracts over £2m you expect to procure in the next 18 months.",
  },
  {
    id: "psr-summary",
    title: "PSR annual summary",
    rule: "Provider Selection Regime Regulations 2023, reg. 25",
    appliesTo: "NHS trusts, ICBs and local authorities buying health care services",
    cadence: "Yearly",
    deadline: "Within 6 months of the year ending (30 September)",
    contains: "Contracts awarded by each process, frameworks, urgent awards, new and departing providers, and representations received.",
  },
  {
    id: "change",
    title: "Contract change notice",
    rule: "Procurement Act 2023, s.75",
    appliesTo: "Changes to contracts under the Act, with some exceptions",
    cadence: "As they happen",
    deadline: "Before the change is made",
    contains: "What is changing and why the change is permitted.",
  },
  {
    id: "termination",
    title: "Contract termination notice",
    rule: "Procurement Act 2023, s.80",
    appliesTo: "Contracts under the Act",
    cadence: "As they happen",
    deadline: "Within 30 days of the contract ending",
    contains: "When and why the contract ended.",
  },
];

export const sources = [
  { label: "Procurement Act 2023: new legislative requirements (GOV.UK)", href: "https://www.gov.uk/government/publications/procurement-act-2023-short-guides/new-legislative-requirements-under-the-procurement-act-2023-html" },
  { label: "Procurement Act 2023 guidance documents (GOV.UK)", href: "https://www.gov.uk/government/collections/procurement-act-2023-guidance-documents" },
  { label: "The Provider Selection Regime: statutory guidance (NHS England)", href: "https://www.england.nhs.uk/long-read/the-provider-selection-regime-statutory-guidance/" },
];

/* ---------- which contracts each duty touches ---------- */

const ACT_START = "2025-02-24"; // the Act went live
const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};
const addYears = (s: string, n: number) => `${Number(s.slice(0, 4)) + n}${s.slice(4)}`;
const today = iso(TODAY);

export const isPsr = (c: Contract) => c.route.startsWith("Provider Selection Regime");
/** Awarded under the Procurement Act: started after it went live, and not a health care service under the PSR. The start date stands in for the signing date. */
export const underAct = (c: Contract) => c.start >= ACT_START && !isPsr(c) && c.route !== "Not recorded";

export type Due = {
  key: string;
  duty: Duty;
  /** What this one covers: a period or a contract */
  covers: string;
  due: string | null;
  /** Shown instead of a date when the rule sets none */
  dueLabel?: string;
  /** What Contravo has ready, or what is still missing */
  status: string;
  tone: "ready" | "needs" | "nothing";
  contract?: Contract;
};

const duty = (id: string) => duties.find((d) => d.id === id)!;

export function upcoming(): Due[] {
  const items: Due[] = [];

  // Spend over £25,000: the month just ended
  items.push({
    key: "spend-2026-09",
    duty: duty("spend"),
    covers: "September 2026",
    due: "2026-10-31",
    dueLabel: "During October",
    status: "Contravo matches each payment to its contract. The ledger itself comes from Finance.",
    tone: "needs",
  });

  // Payments compliance: 1 April to 30 September 2026
  items.push({
    key: "pcn-2026-h1",
    duty: duty("payments-compliance"),
    covers: "1 April to 30 September 2026",
    due: "2026-10-30",
    status: "Needs payment times from Finance. Contravo holds the contracts, not the invoices.",
    tone: "needs",
  });

  // Payments over £30,000: July to September 2026, contracts procured on or after 1 April 2026
  const inScope = contracts.filter((c) => underAct(c) && c.start >= "2026-04-01");
  const paidYet = inScope.filter((c) => c.start <= "2026-09-30");
  const firstStart = inScope.map((c) => c.start).sort()[0];
  items.push({
    key: "s70-2026-q2",
    duty: duty("payments-30k"),
    covers: "July to September 2026",
    due: "2026-10-30",
    status: paidYet.length
      ? `${paidYet.length} ${paidYet.length === 1 ? "contract" : "contracts"} in scope. Payments come from Finance's ledger.`
      : `No contract in scope had started by 30 September${firstStart ? ` (the first starts on ${formatDate(firstStart, { year: false })})` : ""}, so there should be nothing to report this quarter.`,
    tone: paidYet.length ? "needs" : "nothing",
  });

  // Contract details notices: contracts signed in the last month or starting in the next four
  for (const c of contracts.filter((c) => underAct(c) && c.start >= addDays(today, -30) && c.start <= addDays(today, 120))) {
    const big = (c.totalValue ?? 0) > 5_000_000;
    items.push({
      key: `cdn-${c.id}`,
      duty: duty("contract-details"),
      covers: c.title,
      due: addDays(c.start, 30),
      status:
        c.status === "Active"
          ? big
            ? "Drafted from the signed contract. Over £5m, so a redacted copy is published too."
            : "Drafted from the signed contract, ready to check."
          : `Not signed yet (${c.status.toLowerCase()}). Contravo drafts the notice once it is; the date assumes signing on the start date.`,
      tone: c.status === "Active" ? "ready" : "nothing",
      contract: c,
    });
  }

  // Contract performance: contracts over £5m under the Act, yearly from their start
  for (const c of contracts.filter((c) => underAct(c) && (c.totalValue ?? 0) > 5_000_000 && c.start <= today)) {
    let next = addYears(c.start, 1);
    while (next <= today) next = addYears(next, 1);
    items.push({
      key: `kpi-${c.id}`,
      duty: duty("performance"),
      covers: c.title,
      due: next,
      status: "Needs this year's KPI scores from the contract owner.",
      tone: "needs",
      contract: c,
    });
  }

  // Pipeline: the 18 months from 1 April 2027; contracts over £2m ending in that window need a new procurement
  const windowEnd = "2028-09-30";
  const ending = contracts.filter((c) => !isPsr(c) && (c.totalValue ?? 0) > 2_000_000 && c.end >= "2027-04-01" && c.end <= windowEnd);
  items.push({
    key: "pipeline-2027",
    duty: duty("pipeline"),
    covers: "April 2027 to September 2028",
    due: "2027-05-26",
    status: `${ending.length} ${ending.length === 1 ? "contract" : "contracts"} over £2m end in that window. Contravo lists them as a starting point.`,
    tone: "ready",
  });

  // PSR annual summary: 2026/27, counting so far
  const psrThisYear = contracts.filter((c) => isPsr(c) && c.start >= "2026-04-01" && c.status !== "Draft");
  items.push({
    key: "psr-2026-27",
    duty: duty("psr-summary"),
    covers: "April 2026 to March 2027",
    due: "2027-09-30",
    status: `${psrThisYear.length ? `${psrThisYear.length} PSR ${psrThisYear.length === 1 ? "award" : "awards"}` : "No PSR awards"} recorded so far this year; Contravo counts them by process as they're made. 2025/26 was published on 26 September 2026.`,
    tone: "ready",
  });

  return items.sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999"));
}
