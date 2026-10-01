// What the FOI agent did for each request. Illustrative.

export type FoiSearch = { query: string; where: "Register" | "Documents"; found: number };

export type FoiCase = {
  searches: FoiSearch[];
  /** Contracts the agent proposes; the officer confirms */
  proposed: string[];
  /** Contracts found but proposed as out of scope, with a reason */
  excluded?: { id: string; reason: string }[];
  notSearched: string[];
  withheld?: { what: string; exemption: string; reason: string }[];
  advice: string[];
  officerNotes: { severity: "block" | "check"; text: string; contractId?: string }[];
  /** Override the value column for a contract with what is honestly held */
  valueHeld?: Record<string, { value: string; source: string }>;
};

export const foiCases: Record<string, FoiCase> = {
  "foi-0412": {
    searches: [
      { query: "category: Clinical OR Pathology, status: Active", where: "Register", found: 6 },
      { query: "annual value yearly expenditure NHS contract sum", where: "Documents", found: 5 },
      { query: "charges per annum schedule of payments", where: "Documents", found: 4 },
      { query: "clinical service diagnostic equipment patient", where: "Documents", found: 7 },
    ],
    proposed: ["mes-imaging", "path-reagents", "vaccine-cold-chain", "patient-transport", "mri-mobile", "endoscopy-decon"],
    excluded: [{ id: "epr", reason: "Digital system used clinically, but registered as Digital, not Clinical" }],
    notSearched: ["Email", "Shared drives", "Finance ledger and invoices"],
    withheld: [
      {
        what: "Endoscopy decontamination service (draft)",
        exemption: "Section 22",
        reason: "Information intended for future publication once the contract is awarded.",
      },
    ],
    advice: [
      "The trust holds total contract values. Annual values are held for most contracts, but not all. You may want to ask for total contract value instead, which can be provided for every contract.",
      "If “Clinical” is meant to include digital systems used in patient care, such as the electronic patient record, please let us know and we will widen the search.",
    ],
    officerNotes: [
      {
        severity: "block",
        text: "No reliable total can be given. Values for one contract disagree between the register (£720,000 a year) and the signed schedule (£680,000 a year). Confirm which is current before sending.",
        contractId: "mri-mobile",
      },
      {
        severity: "check",
        text: "The endoscopy decontamination contract is still a draft with no supplier recorded. Section 22 is proposed, but the public interest test still needs to be recorded.",
        contractId: "endoscopy-decon",
      },
      {
        severity: "check",
        text: "The Corvel pathology price is in dispute (a 9.4% rise has been requested). The disclosed figure is the current contracted price. Consider adding a note.",
        contractId: "path-reagents",
      },
      {
        severity: "check",
        text: "Section 43 (commercial interests) has not been applied to any supplier pricing. Check whether any supplier has asked for confidentiality.",
      },
    ],
    valueHeld: {
      "mri-mobile": { value: "£720,000 (register) / £680,000 (schedule)", source: "Register and document disagree" },
      "endoscopy-decon": { value: "Withheld", source: "Section 22" },
    },
  },
  "foi-0419": {
    searches: [
      { query: "cleaning domestic services", where: "Register", found: 1 },
      { query: "cleaning domestic housekeeping contractor", where: "Documents", found: 2 },
      { query: "re-tender reprocurement intention cleaning", where: "Documents", found: 0 },
    ],
    proposed: ["cleaning"],
    excluded: [{ id: "linen", reason: "Mentions theatre linen handling, but it is a laundry contract, not cleaning" }],
    notSearched: ["Procurement pipeline and board papers", "Email"],
    advice: [
      "Whether the trust will re-tender is a future intention, not recorded information. We can tell you that no procurement for cleaning services has been published yet.",
    ],
    officerNotes: [
      {
        severity: "check",
        text: "The requester is a supplier, probably a competitor. Contract end date and supplier name are usually released. Check with Estates whether a re-procurement decision has been minuted.",
      },
    ],
  },
  "foi-0398": {
    searches: [
      { query: "IT support service desk desktop", where: "Register", found: 1 },
      { query: "service desk support hours incident resolution", where: "Documents", found: 1 },
    ],
    proposed: ["desktop-support"],
    notSearched: ["Email", "Shared drives"],
    withheld: [
      {
        what: "Schedule 4 (pricing) of the desktop support contract",
        exemption: "Section 43(2)",
        reason: "Unit rates would prejudice the supplier’s commercial interests during a live framework.",
      },
    ],
    advice: ["A copy of the contract with the pricing schedule redacted is attached."],
    officerNotes: [
      {
        severity: "block",
        text: "Contract values are in US dollars. Confirm the sterling figure with Finance before disclosure.",
        contractId: "desktop-support",
      },
      { severity: "check", text: "Redactions to Schedule 4 have been proposed and need sign-off by the Head of IG." },
    ],
  },
  "foi-0425": {
    searches: [
      { query: "patient transport non-emergency PTS", where: "Register", found: 1 },
      { query: "patient transport annual charges payments made", where: "Documents", found: 1 },
      { query: "spend expenditure financial year transport", where: "Documents", found: 0 },
    ],
    proposed: ["patient-transport"],
    notSearched: ["Finance ledger and invoices", "Email"],
    advice: [
      "The trust holds the contracted annual value, not what was actually spent in each year. Actual spend comes from the finance ledger, which has been asked for separately.",
    ],
    officerNotes: [
      {
        severity: "block",
        text: "The request asks for actual spend over three financial years. The contract only shows the contracted value from October 2023. Ask Finance for ledger figures for 2023/24, 2024/25 and 2025/26.",
        contractId: "patient-transport",
      },
      {
        severity: "check",
        text: "The contract started on 1 October 2023, so 2023/24 covers only part of the year. Explain this to the requester.",
      },
    ],
  },
};
