import { contracts } from "./data";

export type Source = { contractId: string; clauseId: string };

export type Answer = {
  /** Paragraphs. `[n]` marks a citation to sources[n-1]. */
  body: string[];
  sources: Source[];
  /** Honest limits on the answer — principle 2: flag, don't fill */
  caveats?: string[];
  searched: number;
  followUps?: string[];
};

type Pattern = { match: RegExp; answer: Answer };

const N = contracts.length;

const patterns: Pattern[] = [
  {
    match: /end.*early|terminat|get out|exit/i,
    answer: {
      body: [
        "One contract clearly lets the trust end early without the supplier being in breach. The imaging managed equipment service can be ended with 12 months’ notice, but the trust then pays a termination sum calculated under Schedule 9 [1].",
        "None of the contracts I can read let you end early for free. The vaccine fridge monitoring contract is the cheapest to leave: give notice by 16 October and it ends on 15 November instead of renewing [2].",
      ],
      sources: [
        { contractId: "mes-imaging", clauseId: "18.3" },
        { contractId: "vaccine-cold-chain", clauseId: "5.2" },
      ],
      caveats: [
        `Termination clauses have only been extracted for 3 of the ${N} contracts. The other contracts may still allow early exit, so this isn’t a complete answer.`,
        "Schedule 9 of the imaging contract (the termination sum) hasn’t been extracted, so I can’t say what leaving would cost.",
      ],
      searched: N,
      followUps: ["What would the imaging termination sum be?", "Which contracts renew automatically?"],
    },
  },
  {
    match: /fridge|vaccine|stock loss|who pays/i,
    answer: {
      body: [
        "Mostly the trust. Under the Polar Assure contract the supplier isn’t liable for lost vaccines or medicines, however the loss happens, unless it was caused by their gross negligence [1].",
        "In practice that means a sensor fault or a missed alert would usually be the trust’s loss. The contract renews for two years unless notice is given by 16 October 2026 [2], so this is a good moment to renegotiate the liability.",
      ],
      sources: [
        { contractId: "vaccine-cold-chain", clauseId: "9.1" },
        { contractId: "vaccine-cold-chain", clauseId: "5.2" },
      ],
      caveats: ["The trust’s own insurance may cover stock loss. Insurance policies aren’t in Contravo, so check with the risk team."],
      searched: N,
      followUps: ["Which contracts renew automatically?", "Which contracts let us end early without a penalty?"],
    },
  },
  {
    match: /rpi|cpi|inflation|prices? (rise|increase)|uplift|index/i,
    answer: {
      body: [
        "Three contracts have a clause that raises prices automatically, and they work differently.",
        "The imaging managed equipment service rises by the full rate of RPI every April, with no cap [1]. That is the most exposed of the three.",
        "The pathology contract caps rises at CPI [2]. Corvel has asked for 9.4%, which is above that cap, and the trust can object until 8 October [3].",
        "The cleaning contract rises by CPI plus 1% each July, capped at 5% [4].",
      ],
      sources: [
        { contractId: "mes-imaging", clauseId: "7.3" },
        { contractId: "path-reagents", clauseId: "11.4" },
        { contractId: "path-reagents", clauseId: "11.5" },
        { contractId: "cleaning", clauseId: "8.1" },
      ],
      caveats: [`Indexation clauses have been extracted for 3 of the ${N} contracts. Others may have price review terms that haven’t been read yet.`],
      searched: N,
      followUps: ["Draft an objection to the Corvel price rise", "When does the imaging contract renew?"],
    },
  },
  {
    match: /renew|auto|evergreen|roll/i,
    answer: {
      body: [
        "Three contracts renew automatically unless someone gives notice in time.",
        "The vaccine fridge monitoring contract renews for 24 months unless notice is given by 16 October 2026 [1].",
        "The imaging managed equipment service extends for 12 months at a time unless notice is given six months before the end, so by 17 October 2026 [2].",
        "The telephony contract also renews for 12 months. Its notice date is 2 November 2026.",
      ],
      sources: [
        { contractId: "vaccine-cold-chain", clauseId: "5.2" },
        { contractId: "mes-imaging", clauseId: "3.2" },
      ],
      caveats: ["The telephony renewal terms come from the contract register. The clause itself hasn’t been extracted, so check the document before relying on that date."],
      searched: N,
      followUps: ["Which contracts let us end early without a penalty?", "Who pays if the vaccine fridge fails?"],
    },
  },
  {
    match: /expire|expiry|end date|when does|managed equipment|imaging/i,
    answer: {
      body: [
        "The imaging managed equipment service with Halden Medical Systems runs until 17 April 2027 [1].",
        "It doesn’t simply end then. It extends automatically for 12 months unless the trust gives six months’ written notice, which means notice by 17 October 2026 [2].",
      ],
      sources: [
        { contractId: "mes-imaging", clauseId: "3.1" },
        { contractId: "mes-imaging", clauseId: "3.2" },
      ],
      searched: N,
      followUps: ["Can we end the imaging contract early?", "How do prices rise on the imaging contract?"],
    },
  },
  {
    match: /linen|duplicate|twice|overlap/i,
    answer: {
      body: [
        "Yes. Theatre linen is included in two contracts. The Brightwell cleaning contract covers laundering theatre linen and scrubs for Theatres 1–12 [1], and the Whiteleaf linen contract covers theatre linen, gowns and scrubs for all theatre suites at the main site [2].",
      ],
      sources: [
        { contractId: "cleaning", clauseId: "sch1.4" },
        { contractId: "linen", clauseId: "sch2.1" },
      ],
      caveats: ["The £38,400 a year overlap is an estimate based on Whiteleaf’s theatre volumes. Invoices haven’t been matched yet."],
      searched: N,
    },
  },
];

export const suggestions = [
  "Which contracts let us end early without a penalty?",
  "Who pays if the vaccine fridge fails?",
  "Which contracts renew automatically?",
  "How do prices rise across our contracts?",
  "Are we paying for anything twice?",
];

export function answer(q: string): Answer {
  const hit = patterns.find((p) => p.match.test(q));
  if (hit) return hit.answer;
  return {
    body: [
      "I couldn’t find anything in the contracts that answers this directly, so I won’t guess.",
      "Try naming a supplier, a service or a type of clause, for example “notice period”, “liability” or “price review”.",
    ],
    sources: [],
    caveats: [`I searched the register and the text of all ${N} contracts. Emails, invoices and finance systems aren’t in Contravo.`],
    searched: N,
    followUps: suggestions.slice(0, 3),
  };
}
