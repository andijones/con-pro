# Contract page: Tabs

Decided 6 October 2026 from `/proto/contract-page`. The other layouts (Current, Split and Merged) **stay in the prototype folder**. The brief: two columns, the contract and risk map on the right and everything else on the left, no duplicated information, and as digestible as possible.

## Decision

- **Header:** **Edit details** and **Ask about this contract**.
  - The status line holds the status and extraction badges, the supplier (once, in Midnight), the category, the business unit and the route, plus a quiet **Review extraction** link on the right.
  - When a contract is waiting for a check, one alert says so. The duplicate "Review extraction" button is gone.
- **Two columns from 1280px (`xl`):** the panel on the left (24rem) and the contract on the right (`ContractReader`, Risk map). Below 1280px they stack, panel first.
- **The panel** (`components/contravo/contract-panel.tsx`):
  - **Look:** a Frost panel (`bg-muted`, 12px padding) with three line tabs:
    - **Needs you (n):** the default when the contract has decisions
    - **Details:** the default when it has none
    - **Activity**
  - **Cards:** every tab is made of small white cards (`bg-card`, `shadow-card`).
  - **Scrolling:** the panel is sticky under the page bar and scrolls on its own if it's taller than the screen. Its padding keeps card edges and shadows from being clipped.
- **Decision cards, without the repeats:**
  - the kind, and "16 days left · 17 Oct"
  - the title and the explanation
  - the amount, and the owner only when it isn't the contract owner
  - the main action on its own line, then **Show clause 3.2** (jumps the contract to that clause and focuses it) and **Mark handled** (Undo with no time limit) as quiet buttons side by side
- **Details:** one card listing the next date (or "Not set until the details are checked"), annual value, total value, term, notice and review, and owner. Any "Check before you rely on these figures" warning sits underneath.
- **Activity:** one small card per event.
- **Links between the two:** a clause's "Needs a decision" link (`#d-…`) switches the panel to Needs you and brings that card into view.

## Duplicates removed

| Duplicate | Fix |
|---|---|
| The notice deadline as a hero countdown three times (key facts, the decision card, the clause note) | One plain line in Details. The decision keeps its date line, and the clause keeps its plain English |
| The contract's name inside every decision card | Removed |
| The owner on every decision as well as in the facts | Shown only when the decision's owner differs |
| The "Clause 3.2" chip on decisions, plus the clause linking back | Replaced by "Show clause 3.2", one direction |
| "Review extraction" as both a button and an alert | Now a status-line link, plus an alert only when a check is waiting |
| The supplier on its own line | Moved into the status line |

## Kept as prototypes (not rejected)

- **Split:** facts, decisions and activity stacked in the left column, all visible.
- **Merged:** the deadline once, plus each decision's actions inside the clause that drives it.

## Update, 7 October 2026: the left panel is a tray

The Needs you / Details / Activity panel now uses the design system's tray (`tray` / `tray-card`, the same grey well of white cards as the Home rail and contravo.ai). It used to be built by hand: `bg-muted p-3 rounded-xl` with `rounded-lg shadow-card` cards. Now its corners, padding and hairline card shadows match the Home rail exactly. The sticky wrapper uses the tray's 16px radius, so its scroll clipping follows the tray's corners.
