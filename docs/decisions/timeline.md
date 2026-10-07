# Timeline: Zoom

Decided 7 October 2026 from `/proto/timeline`, which is kept with the other options.

## Decision

A live Gantt of every contract that isn't a draft, which you can zoom, grouped by what each contract needs.

- **Range:** a `ToggleGroup` with **6 months**, **1 year** (the default) and **3 years**. The scale starts a month before today. Ticks are months for 6 months and 1 year, and quarters for 3 years. Years are labelled at each January.
- **Today:** a dark line down the chart, labelled with a "Today" pill on the scale.
- **Groups,** in this order. Each has a band with its name, count and one-line hint:

  | Group | Rule |
  |---|---|
  | Notice window missed | Active, and the notice deadline has passed |
  | Decide now | Notice deadline within 90 days |
  | Coming up | Notice deadline within a year |
  | Later | Further out, or not started |
  | Ended | Finished, terminated or archived |

- **Rows:** the contract name and one line in plain words: "Notice by 16 Oct 2026 · 15 days left", "Too late for notice · ends 31 Oct 2026" or "Ended …". The line is red for Decide now and Missed.
- **Bars,** using the timeline tokens:
  - Running, then the notice window in amber (red once missed).
  - A dashed outline for the automatic renewal period.
  - A diamond at the notice deadline, red within a month.
  - Bars that run past the range end with "ends 2029 →". Contracts that haven't started yet say "Starts … →".
- **Select a row** to open its details inline:
  - value, including dollar contracts shown in dollars
  - run dates and notice date
  - a badge: "Renews for 12 months unless notice is given" or "Ends. Decide what replaces it."
  - **Open contract** and **Ask about options**, which opens a chat with the question filled in
- **Code:** the model is in `src/lib/timeline.ts`. The view is `components/contravo/timeline-view.tsx`, a client component. The page is a thin server wrapper.

## Rejected (still in `/proto/timeline`)

- **The static chart** (September 2026 to the end of 2028, sorted by notice date): fixed range, so catering (2029) and car parking (2031) were cut off. It showed no money and no grouping, so you had to read the bars to see what was urgent.
- **Horizon:** a 12-month bar chart of the annual value whose notice deadline falls in each month, with an agenda of decision cards by month. Best for planning the year (April 2027 carries £6.2m), but you lose each contract's run.
- **Cliff:** total committed annual value over time (£17.2m today, £12.2m ending in the next 12 months, the biggest drop −£4.2m in April 2027), with notice deadlines underneath and contracts by category with bars sized by value. Best for finance and senior conversations, but the least about what to do. Worth reviving as a view on Reports.
