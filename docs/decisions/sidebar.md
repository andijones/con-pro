# Sidebar: Workbench

Decided 1 October 2026 from the in-place sidebar prototype (`src/proto/sidebar`, now deleted).

## Decision

A dense, keyboard-first sidebar that doubles as a working set.

- **No section label above the nav.** Home, Contracts, Timeline, FOI requests, Reports and Audit sit in 36px rows with 2px between them (spaced out on 2 October 2026; 32px rows felt crammed). Chat is no longer a nav item.
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
- **Spacing** (2 October 2026): 17rem wide (was 16rem) so fewer titles truncate; 64px header with the logo at 18px tall (was 22px); 24px under New chat; 28px between groups; section labels sit 4px above their rows.
- **Alignment:** every icon, dot and avatar sits on one column (x = 20px), and every label on another (x = 44px). The gutter is 12px throughout.
- **Collapse** (updated 2 October 2026, when the app header was removed):
  - The collapse button sits in the sidebar, beside the logo (a panel icon, with a tooltip showing ⌘B).
  - Collapsed, the Contravo mark is the expand button. It shows the expand icon on hover or keyboard focus.
  - On phones, a slim bar with a menu button and the logo opens the sidebar.
  - There is no app header. Its search moved to the Ask tab (⌘J), the notifications bell did nothing, and the organisation label added no information.

## Rejected

- **Current:** the "Navigation" label added clutter, Sign out sat loose in the sidebar, and spacing was uneven.
- **Grouped** (workspace switcher plus three unlabelled groups): calm and conventional, but it duplicated the organisation already shown in the header, and the groupings were a guess.
- **Status** ("This week" card plus a spacious nav without badges): made urgency visible everywhere, but it repeated Home and cost a lot of vertical space. Removing the badges hid counts.
- **Hover-revealed shortcut hints** (first cut of Workbench): the count disappeared exactly when you pointed at it. Replaced by the G-reveal.

## Update, 6 October 2026: Needs you and Chats fold away

- Both sections **start collapsed** to keep the sidebar tidy. The whole section label is the button, with a chevron that turns when the section opens.
- **Needs you** shows a red (`critical`) count `Badge` with the number of contracts inside it. Screen readers hear "3 contracts".
- **Chats** keeps "View all" visible when folded.
- The open or closed state lasts while you move between pages. It isn't saved between visits, so each visit starts calm.
- **Needs you shows urgent contracts only**: a decision due within 7 days, or overdue. Everything else waits on Contracts and Home. The badge counts these contracts, and every row is red. When nothing is urgent, the section is hidden.
- **Chats is now "Recent chats"**, with a chat icon (`MessageSquare`) before the label. Needs you has an alert icon (`CircleAlert`) to match.
