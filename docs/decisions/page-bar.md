# Page bar

Decided 2 October 2026.

Every page with a title opens with a **page bar**: one sticky strip across the top of the page panel that holds the page title (30px) and the page's actions, with a soft shadow underneath (`--page-bar-shadow`). The page's description sits just below the bar and scrolls with the content. Before this, the title, the description and the buttons stacked up as a tall block.

- **Component:** `PageHeader` (`components/contravo/primitives.tsx`), which takes `title`, `actions`, `leading` and the description as children. Detail pages put `BackLink` in `leading`: an icon button labelled "Back to …".
- **Utility:** `page-bar` in `globals.css`.
  - It runs edge to edge across the panel from inside any max-width page wrapper (`main` is a size container), while its contents line up with the page.
  - It's 64px tall, with a frosted white background.
  - It's sticky from md. On phones it scrolls away under the menu bar.
- **Tokens:**
  - `--page-gutter`: main's padding, which the bar bleeds through
  - `--page-bar-shadow`
  - `--page-bar-offset`: where sticky side panels sit, such as the clause reader and the FOI aside
- **Pages:** Home, Contracts, a contract, Timeline, FOI requests, an FOI request, Reports, Audit and Chat.
- **Not the old app header:** that was one bar for the whole app, and it held search, notifications and the organisation name (see `sidebar.md`). This bar belongs to each page, and it carries only that page's title and actions.
- **Removed:**
  - the "Plan" eyebrow on Timeline
  - the text "← Contracts" and "← FOI requests" links above the titles, which are now the back button in the bar

The FOI reference and the contract's status line moved below the bar.

## One page width (2 October 2026)

Every page shares one content width, `--page-max` (1180px). It's set once in the app layout, so titles and content no longer jump when you move between pages.

Before this, the widths were:

| Width | Pages |
|---|---|
| 860px | Audit |
| 880px | Home, Chat |
| 960px | FOI requests |
| 1080px | Contracts |
| 1180px | The rest |
| 1280px | Design system |
| No limit | Review pages |

Text inside still keeps its own reading measure (about 65 characters). The page panel reserves its scrollbar space (`scrollbar-gutter: stable`), so short pages with no scrollbar are exactly as wide as long ones.
