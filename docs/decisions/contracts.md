# Contracts: Grouped + Finder

Decided 2 October 2026 from the Contracts prototype (`/proto/contracts`, now deleted). It's built for a busy employee who opens the page to ask "what do I need to worry about?" or "where's that contract?"

## Decision

Sections sorted by what each contract needs, with search and filters on top and a preview on click.

- **Header:** "Contracts" and one line: "12 live contracts worth about £17.2m a year, grouped by what they need from you." The page has two actions, **Export** (outline) and **Upload contract** (primary).
- **Search:** one large box (48px tall) that searches title, supplier, contract type and business unit.
- **Filters:** the design system's `ToggleGroup` (outline, `type="multiple"`), with a count on each:
  - Mine
  - Needs a decision
  - Details to check
  - Ending within 6 months
  - Renews automatically
  - Over £1m a year

  Filters combine with AND. "Clear filters" appears once any are on.
- **Sections:**
  - Needs you
  - Ending or renewing within 6 months
  - Running smoothly
  - Being set up
  - Finished

  Each section header holds a title, a count `Badge` and a one-line explanation. **Only Needs you starts open.** Searching or filtering opens every section that has matches and hides empty ones.
- **Section colour** (updated 2 October 2026): every section header is white, the base tone, with a Frost tint on hover. Urgency is carried by the count `Badge` alone:

  | Section | Count badge |
  |---|---|
  | Needs you | `critical` (red) |
  | Ending or renewing within 6 months | `warning` (amber) |
  | Running smoothly, Being set up, Finished | `outline` |

  Rows are white, with a Frost tint on hover.
- **Rows** show four facts:
  - contract and supplier
  - **what happens next**, as one plain sentence with a countdown (for example "Renews for 12 months unless notice is given by 17 Oct 2026, in 16 days")
  - value
  - owner
- **Preview** (`Sheet`, opened from any row):
  - status, title and supplier
  - a lilac "What happens next" callout
  - key facts: value, run dates, notice, renewal, type and owner
  - open decisions
  - **Open contract** (or **Check the details** for AI-read drafts) and **Ask about this contract**
  - **Archive** and **Delete** set apart below a rule. Delete asks for confirmation, and both can be undone with no time limit.
- **Empty result:** "Nothing matches", with a link to ask the question in chat instead.

## How a contract is grouped

| Group | Rule |
|---|---|
| Needs you | AI extraction is ready for a person to check, or an active contract has an open decision |
| Being set up | Being read, or Draft, Awaiting upload, Under review or Legal review |
| Finished | Expired, Terminated or Archived |
| Ending or renewing within 6 months | Active, and the notice date (or end date, if notice has passed) is within 183 days |
| Running smoothly | Active, with nothing within 183 days |

Deleted contracts are hidden.

## Removed

- **The 12-column table:** it scrolled sideways.
- **Five filter dropdowns:** Status, Contract type, Owner, Business unit and Counterparty. Search covers type, department and supplier.
- **Column sorting:** rows sort by their next date within each section.
- **The per-row menu:** it held Open, Review, Edit details, Ask, Archive and Delete. These moved to the preview and the contract page.

## Rejected

- **Current:** twelve columns and five dropdowns left a busy person to work out what mattered.
- **Grouped on its own:** strong triage, but finding a specific contract relied on a small search box, and rows jumped straight away from the page.
- **Finder on its own:** the most familiar, but it didn't say what was urgent until you picked a filter.
- **Lifecycle** (each contract as a bar in time, with notice windows and renewals): the best planning view, but the least precise at a glance. Worth reviving as a view on Timeline or Reports.
- **Semantic section colours** (amber for coming up, green for running smoothly, plus a coloured edge stripe): too colourful. Replaced by the brand tonal ramp.
- **Brand tonal ramp** (Lilac, light Lilac, Frost, Frost, White headers with a violet count badge): still too purple, and violet said "brand" rather than "urgent". Replaced by white headers with red and amber badges.
- **Custom filter pills:** replaced by the design system `ToggleGroup`, and the count pills by `Badge`.
