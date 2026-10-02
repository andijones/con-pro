# Ask entry point: Edge tab drawer

Decided 1 October 2026 from `/proto/chat-entry` (two rounds, now deleted).

## Decision

Ask Contravo is a drawer that slides out from the right edge of every page.

- A violet tab ("Ask Contravo", plus a ⌘J hint) sticks out of the right edge, centred vertically. It rides on the drawer's leading edge, so it always marks where the drawer is, and it becomes the close control when the drawer is open.
- The drawer overlays the page. It doesn't push content. Width is `min(420px, 100vw − 2.75rem)`, so the tab stays visible on a phone.
- Non-modal: the page behind stays usable. ⌘J toggles it, Escape closes it, and focus goes to the composer on open and back to the tab on close.
- It's page-aware. On a contract page it asks about that contract and suggests questions for it. Elsewhere it searches all contracts.
- Citations open the clause on the contract page (`?clause=`).
- The conversation persists across navigation (it's mounted in the root layout). "Open in Chat" goes to the full page.
- Hidden on `/chat`, which already is the full chat.
- Motion:
  - Enter: `translate` 250ms `--ease-out`.
  - Exit: 180ms ease-in.
  - Tab hover: nudges left by 2px.
  - Reduced motion: transitions are disabled globally.

## Rejected

- **Current (header bar → /chat page):** you leave the contract you were reading to ask about it.
- **Widget (floating launcher, bottom right):** reads as a customer-support bubble rather than part of the product, and covers content at the point where you're reading. Parked; it could return for small screens.
- **Copilot (docked, header toggle):** the toggle was easy to miss, and the panel permanently took 400px on large screens only.
- **Inline (composer and highlight-to-ask on the page):** only works where there's a contract on the page, and highlighting is a pointer gesture. Dropped for now; highlight-to-ask could sit on top of the drawer later.
- **Peek rail (always-visible 56px rail):** strong for discovery, but it costs 56px on every page and needs page-aware prompts to earn its space.
- **Pull handle (drag to resize, page reflows):** most flexible, but the most complex, and reflowing a long contract while dragging feels heavy. The resize idea could be added to the Edge tab later if people want wider answers.

## Update (2 October 2026): matches New chat

The tab on the drawer's edge now uses the same treatment as the sidebar's New chat button, so the two ways into the AI read as one family:

- white surface with the outline button's edge (`--shadow-button`), Midnight text, and a solid Frost tint on hover, so the glow never shows through
- icons (sparkles, chevron, and the drawer header's sparkles) in muted grey instead of violet
- the `ai-glow` halo: the shimmer ramp, 1px outside the edge, 2px blur at 70%, drifting slowly and stopping for reduced motion
- the ⌘J hint uses the design system `Kbd`
