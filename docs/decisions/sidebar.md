# Sidebar: Workbench

Decided 1 October 2026 from the in-place sidebar prototype (`src/proto/sidebar`, now deleted).

## Decision

A dense, keyboard-first sidebar that doubles as a working set.

- **No section label above the nav.** Home, Contracts, Timeline, FOI requests, Reports and Audit sit in compact 32px rows. Chat is no longer a nav item.
- **New chat** is an outline button under the logo (pen icon). It opens `/chat`, and the shortcut is G then N. When the sidebar is collapsed it shrinks to an icon.
- **Shortcuts:** G then a letter (H, C, T, F, R, A, N), in the style of Linear. Pressing G reveals every hint for one second, then they hide again. Counts never swap out on hover. Only New chat shows its hint all the time.
- **Needs you:** the three contracts with the nearest decisions. A red dot means within 7 days, amber otherwise. Days left trail on the right, in the same column as the nav counts, with spoken text for screen readers.
- **Chats:** every conversation, with no repeated icons and titles on the label column, plus a "View all" link.
- **One user menu** at the bottom, behind a hairline, holds everything personal:
  - your name and email
  - Profile
  - Notifications and settings
  - Help and support
  - Design system
  - Sign out (moved out of the sidebar body)
- **Alignment:** every icon, dot and avatar sits on one column (x = 20px), and every label on another (x = 44px). The gutter is 12px throughout.
- **Collapse:** only the page header has a collapse control. The sidebar has no duplicate.

## Rejected

- **Current:** the "Navigation" label added clutter, Sign out sat loose in the sidebar, and spacing was uneven.
- **Grouped** (workspace switcher plus three unlabelled groups): calm and conventional, but it duplicated the organisation already shown in the header, and the groupings were a guess.
- **Status** ("This week" card plus a spacious nav without badges): made urgency visible everywhere, but it repeated Home and cost a lot of vertical space. Removing the badges hid counts.
- **Hover-revealed shortcut hints** (first cut of Workbench): the count disappeared exactly when you pointed at it. Replaced by the G-reveal.
