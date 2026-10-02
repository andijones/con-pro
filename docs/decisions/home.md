# Home: NewTab

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
