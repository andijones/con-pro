/**
 * Savings: what Contravo has found, what's being worked on and what Finance has confirmed.
 * One pipeline, Found → In progress → Secured. Used by Home (components/contravo/home-value.tsx).
 * Decision record: docs/decisions/home.md
 */
import { contracts, decisions } from "./data";
import { daysUntil } from "./dates";

export type Stage = "found" | "progress" | "secured";
export type Opp = {
  id: string;
  title: string;
  contractId: string;
  clauseId?: string;
  amount: number;
  basis: string;
  due?: string;
  owner: string;
  action?: string;
  stage: Stage;
  securedOn?: string;
};

export const title = (id: string) => contracts.find((c) => c.id === id)?.title ?? id;

/** Found: the savings Contravo has spotted that still need a person */
export const found: Opp[] = decisions
  .filter((d) => (d.kind === "money" || d.kind === "price") && d.impact)
  .map((d) => ({
    id: d.id,
    title: d.title,
    contractId: d.contractId,
    clauseId: d.clauseId,
    amount: d.impact!.amount,
    basis: d.impact!.label,
    due: d.due,
    owner: d.owner,
    action: d.actions.primary,
    // Concept state: the linen duplicate is already with Finance
    stage: d.id === "d-linen-dup" ? "progress" : "found",
  }));

/** Concept history: savings Finance has already confirmed this financial year */
export const history: Opp[] = [
  { id: "s-telephony", title: "Telephony price rise held at CPI after objection", contractId: "telecoms", amount: 14_900, basis: "a year, confirmed by Finance", owner: "priya", stage: "secured", securedOn: "2026-09-18" },
  { id: "s-agency", title: "Agency nursing rates brought down to the framework", contractId: "agency-nursing", amount: 41_200, basis: "confirmed by Finance", owner: "leon", stage: "secured", securedOn: "2026-09-30" },
  { id: "s-print", title: "Managed print re-let on the framework instead of renewing", contractId: "print-managed", amount: 27_500, basis: "a year, confirmed by Finance", owner: "priya", stage: "secured", securedOn: "2026-09-04" },
];

/** What a person does next at each stage, in plain English. The done label names the step, not a status. */
export const steps: Record<string, { found?: string; done?: string; progress?: string }> = {
  "d-mes-vat": {
    found: "Send the evidence to Finance so they can reclaim the VAT from HMRC. Contravo has drafted the note and attached clause 9.1.",
    done: "I’ve sent it to Finance",
    progress: "Finance is preparing the VAT claim. When they confirm the amount, mark it as secured.",
  },
  "d-path-uplift": {
    found: "Object to Corvel in writing by 8 October, citing the CPI cap in clause 11.4. Contravo has drafted the letter for you to check and send.",
    done: "I’ve sent the objection",
    progress: "Waiting for Corvel to reply. If they accept CPI, mark it as secured once Finance sees the new rate on an invoice.",
  },
  "d-linen-dup": {
    found: "Ask Finance to check both linen invoices, then cancel the duplicate service.",
    done: "I’ve asked Finance",
    progress: "Finance is checking both invoices. When the duplicate is cancelled or refunded, mark it as secured.",
  },
};
export const nextStep = (o: Opp) =>
  o.stage === "found"
    ? (steps[o.id]?.found ?? "Check the evidence, then take the first step.")
    : (steps[o.id]?.progress ?? "When Finance confirms the money, mark it as secured.");

export const sections: { stage: Stage; title: string; help: string }[] = [
  { stage: "found", title: "Found: take the first step", help: "Contravo found these. Check the evidence, do the next step, then tell Contravo you’ve done it." },
  { stage: "progress", title: "In progress: waiting for confirmation", help: "You’ve acted. When Finance confirms the money has been saved, mark it as secured." },
  { stage: "secured", title: "Secured this year", help: "Confirmed by Finance. These count towards the total above." },
];

/** Not savings: spend that commits automatically unless someone decides */
export const commits = decisions
  .filter((d) => d.kind === "notice")
  .map((d) => ({ d, days: daysUntil(d.due) }))
  .sort((a, b) => a.days - b.days);

/** How much of the estate the figures are counted from (principle 2: flag, don't fill) */
export const coverage = {
  checked: contracts.filter((c) => c.extraction === "Reviewed").length,
  total: contracts.length,
  noValue: contracts.filter((c) => c.annualValue == null).length,
};
