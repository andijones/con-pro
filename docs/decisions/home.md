# Home: Value

Decided 5 October 2026. The concepts were built at `/proto/home` and `/proto/value`; both stay as prototypes for now. It's written for finance and procurement leads who answer for public money: show what Contravo is worth, then exactly what to do next.

## Decision

- **Page bar:** "Good morning, Priya", plus **Export savings report**. The line below says "What Contravo has found and secured this year, and what you can act on today."
- **Value overview:** one card holding:
  - **Secured this financial year, confirmed by Finance**, as the big Mint figure
  - **Being worked on** and **Found, waiting on a decision**
  - one pipeline bar: Secured in Mint, In progress in Iris, Found in amber
  - filters with a total on each
  - an honest note: "Counted from 18 of 21 checked contracts. 4 have no value recorded, so savings there aren't counted yet."
- **Grouped by what you do next:**

  | Section | Text under the heading |
  |---|---|
  | Found: take the first step | "Contravo found these. Check the evidence, do the next step, then tell Contravo you've done it." |
  | In progress: waiting for confirmation | "You've acted. When Finance confirms the money has been saved, mark it as secured." |
  | Secured this year | "Confirmed by Finance. These count towards the total above." |

  Found and In progress sort by deadline, soonest first. Secured sorts by date, most recent first.
- **Every saving** carries:
  - a three-step tracker (Found, In progress, Secured)
  - the amount and how it was worked out
  - its clause and owner
  - a **Your next step** panel in plain English, amber while it's at Found
  - the real action button, plus a specific "done" button: "I've sent the objection", "I've sent it to Finance", "Finance has confirmed it"

  Every move offers Undo with no time limit.
- **Colour:** amber marks Found as "needs attention". Red stays for deadlines within 7 days, so it keeps meaning danger.
- **Side rail:**
  - **Decide before it commits:** auto-renewals with their notice dates. This is spend you control, so it isn't counted as savings.
  - **Looking for more savings?:** a small box that sells starting a chat, with **Start a new chat** using the AI glow.
- **No Ask Contravo tab on Home.** The box above does that job, so the drawer is hidden on `/` (and on `/chat` as before), along with its ⌘J shortcut.
- **Model:** `src/lib/savings.ts` holds the pipeline:
  - Found: price and money decisions
  - concept history for Secured (telephony held at CPI, agency nursing rates, managed print re-let), clearly labelled
  - the plain-English next steps
  - the coverage figures

  The component is `components/contravo/home-value.tsx`.

## Rejected

- **NewTab** (the previous Home: tiles, a 90-day strip and tabs): calm, but it never showed what Contravo is worth.
- **Queue** and **Queue + health:** a strong daily triage list, but the value story disappeared.
- **Ask** (agent-led, with a morning brief): leans into the AI, but it's hard to scan.
- **Estate** (oversight for leads): the most complete picture, but the busiest page.
- **Value: Focus** (one next step at a time): the least daunting, but it hides the bigger picture.
- **Value: Summary** (three tiles, with detail when you open one): easy to read, but it adds a click before you know what to do.
- **Value: Checklist** (plain to-dos): the most familiar, but it plays down the value.
- **"Find more" suggested questions:** three AI pills read as more things to do. One box that sells a new chat is calmer.

## Previous decision (superseded)

### Home: NewTab

Decided 2 October 2026 from the Home prototype (`/proto/home`, now deleted). It was written for finance and procurement experts who don't necessarily have a SaaS background: clear, obvious and calm.

## Decision

From top to bottom: three numbers, a view of time, then one tab of work.

- **Greeting:** "Good morning, Priya", plus one line: "Here's what needs a decision across your contracts." There's no date line and no extra commentary.
- **Three tiles,** each tinted with a design-system shade:
  - **Lilac** (`bg-highlight`): needs you this week
  - **Frost** (`bg-muted`): commits automatically this month unless someone gives notice
  - **Mint** (`bg-success-muted`): found that may be recoverable

  They're plain figures and don't navigate.
- **90-day strip** (`Runway`), in a slim card directly under the tiles:
  - The key sits on the card's title line.
  - Each marker is a button. It switches to the item's tab, opens its row, scrolls to it and moves focus there.
  - Money items are square and deadlines are round, so colour is never the only signal.
  - Items marked as done leave the strip.
- **Tabs** (shadcn `Tabs`, `line` variant): This week, This month, Later and FOI requests, each with a count pill.
  - Rows are closed by default, except the first item in This week.
  - A closed row shows a date block, the title, the type, the days left as words and colour, the amount, and a chevron.
  - An open row adds the detail, the full amount, the clause link, the owner, one primary action and "Mark as done", which can be undone with no time limit (WCAG 2.2.1).
  - FOI rows show working day N of 20, who is handling the request, and "Open request".
- **Empty tabs** show "All clear" with a single line of explanation.

## Removed from the old Home

- the date line and the two-part greeting
- the workspace stats grid
- the active-contract counts
- the status chips
- the "Recently added" table
- the FOI clocks, "At stake", "Watching quietly" and "Ask a question" cards
- the third button on each decision card

All of these live on their own pages (Contracts, FOI requests, Reports) or in the Ask tab.

## Rejected

- **Current:** eight blocks competed for attention, every card had three buttons, and the 90-day strip and the lists said the same thing twice.
- **Briefing** (a memo: one decision open in full, the rest one line each, numbers in words): the calmest of the concepts, but only one decision got full space, and FOI couldn't be filtered.
- **Agenda** (decisions and FOI deadlines in one dated list with a detail panel): the only concept to merge FOI into the timeline, but the two columns made it the busiest, and strict date order put a small FOI request ahead of the biggest decision.
- **Tabs without the strip:** clean, but it lost the bird's-eye view of when things fall. Adding the strip back as navigation (markers jump to rows) gave that view without adding a second list.
