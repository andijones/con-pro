# Ask composer: Prompt composer

Decided 2 October 2026 by comparing two composers side by side on `/chat`.

## Decision

Every place you ask Contravo uses one composer: `PromptComposer` (`src/components/ui/prompt-composer.tsx`), installed from `@cult-ui/prompt-composer` and adapted to the brand.

- **Where:**
  - `/chat`, pinned to the bottom of the thread
  - the Ask drawer, using `size="compact"`
  - the design system, under Contravo composites
- **Look:**
  - a frosted surface with the brand halo moving through its rim and a soft background glow behind it
  - an animated avatar (the Paper `Warp` shader)
  - round Attach and Send buttons
- **States:**
  - At rest: a quiet glow.
  - Focused: the glow lifts, and the box takes the 1px Violet field edge and halo.
  - Working: the box says "Reading your contracts…", Send turns into a spinner and the avatar speeds up.
- **Keys:** Enter sends, and Shift+Enter adds a new line. ⌘/Ctrl+Enter also sends. Nothing sends while an IME is composing text.
- **Tokens:** every visual value is a `--composer-*` token in `globals.css`:
  - radius
  - shadow
  - frost and solid surfaces
  - divider
  - rim gradients 1–3
  - aurora gradients 1–2
  - avatar colours 1–5 (read at runtime, because the shader needs plain colours)
  - the shared `--halo-mint`

  Focus uses `--control-focus-edge` and `--control-halo`, and buttons use `--shadow-button`.
- **Accessibility:**
  - The frost is 84–90% white with no dark Violet under it, so the muted placeholder and loading text stay above 4.5:1.
  - The moving layers are `aria-hidden` and hold still for reduced motion.
  - The text area has an `aria-label`, and the visual placeholder is decorative.
  - Buttons are 40×40 with screen-reader labels.
- **Adapted from the original:**
  - brand gradients replace pink, orange and blue
  - a firmer frost
  - our focus edge replaces a faint Iris border
  - Enter sends (the original sent only on ⌘+Enter)
  - a `fine-hover` variant was added, because the original's hover classes relied on it
  - the text area is marked `data-control`, so it draws no second focus outline

## Kept for return

**Option A**, the Halo shell (`src/components/ui/halo-input.tsx`) around an `InputGroup` with scope, attachments and a character count, is commented out in `ask-thread.tsx`. To restore it, uncomment the "Option A only" imports and state, and the `composerA` block.

## Rejected

- **Option A as the default:** quieter, and it kept the scope menu and character count. It felt less like talking to an agent: the box itself never said it was working.
- **The outer blurred glow** (`ai-composer`): read as a smudge around the box and was easily mistaken for focus.

## Prompt suggestions (added 2 October 2026)

Suggested questions and follow-ups use `PromptSuggestion` and `PromptSuggestions` (`src/components/ui/prompt-suggestion.tsx`). They replace the outline buttons on `/chat` (Try asking and follow-ups) and the plain rows in the Ask drawer.

- **Effect:** the Cult UI Halo Button, rebuilt in CSS on the composer tokens (`--composer-rim-1`, `--composer-rim-2`).
  - Two brand gradient blobs drift along the pill's 1px rim and glow through a frosted fill.
  - Hover and keyboard focus brighten the rim.
  - Each chip's drift is offset by its position, so neighbours never glow in step.
- **Not the npm component:** a page shows up to eight of these at once. One Motion animation per chip was too heavy, so they use CSS keyframes on transform only, and stop for reduced motion. The original also staggered each label in letter by letter, which is noise across eight chips, so that was dropped.
- **Layout:** wrapped on wide pages, `stacked` (full width, 14px radius) in the drawer. Each is a `<button>` inside a list labelled "Suggested questions" or "Suggested follow-ups".
- **Accessibility:**
  - 40px tall
  - Midnight label on 84%+ white
  - the global Midnight keyboard outline for focus
  - the rim is `aria-hidden`
- **Tokens:** `--suggestion-radius`, `--suggestion-radius-stacked`, `--suggestion-surface(-hover)`, `--suggestion-shadow(-hover)` and `--suggestion-rim-rest/-active`.

## Update, 6 October 2026: "Focus" chat page, app radii

Decided from `/proto/chat` (kept, with Aurora stage and Midnight). On a white page the frosted composer and the suggestion rims had nothing to glow through, so they washed out.

- **Focus layout:** one centred column, max 48rem.
  - A greeting as the page heading: "What do you need to know, Priya?"
  - The intro, then the Ask / FOI switch, then the composer.
  - The FOI tab has its own heading: "Answer an FOI request".
- **Once a conversation starts,** the greeting and intro step aside: only the switch stays, and the thread gets the full width. The heading changes to "Ask about your contracts" and stays for screen readers. This is `components/contravo/chat-view.tsx`, and `AskThread` takes `onThreadChange`.
- **The glow is turned up, not given a backdrop.** `.ai-underglow` in `globals.css` pools the composer's rim colours beneath it: Iris, Mint and Lilac at 28px blur, opacity 0.6. It sits under the empty-state composer and, at 0.45, under the composer pinned at the bottom of a conversation.
- **Suggestions:** a two-column grid of cards. Each card has a topic icon (Lilac tile, Violet icon), the question and an arrow, and the rim rests at 0.9. An odd last card spans both columns.
- **Previous conversations** became a compact "Recent chats" list with the date on the right.
- **Radii follow the app's scale:**
  - The composer is a card: `--composer-radius` is rounded-xl, 11px, the same corner as every card.
  - Suggestions are buttons: `--suggestion-radius` and `-stacked` are rounded-lg, 8px.
  - The composer's attach and send buttons are rounded-lg, like every icon button.
  - Avatars stay round.

**Rejected, still in `/proto/chat`:**
- **Aurora stage:** a slate-50 panel with Iris, Mint and Lilac colour pools behind the composer. Beautiful, but it adds a decorative layer that the rest of the calm app doesn't have.
- **Midnight:** a dark brand panel with deep-glass suggestions. The glow looks its best there, but it's a heavy dark block in a light-only app.

## Quiet list (7 October 2026)

Decided from `/proto/chat` round 2 (kept: Focus, Aurora stage, Midnight, Quiet list, Chips). Focus put a glowing composer above five glowing suggestion cards, so everything competed.

- **The composer is the one AI moment.** It is solid white at rest (no `blobTranslucent`) and goes frosted only while it answers. Only its 1px rim moves.
- **A shadow on top of the glow.** `--composer-shadow` = hairline ring, then a tight contact shadow, then a soft lift (`0 10px 28px -10px` at 18%).
- **Softer underglow.** The `.ai-underglow` defaults are now 24px blur at 35%, tucked further in. The thread uses the same defaults.
- **`PromptSuggestion` is a quiet list.** Rows are divided by `--brand-line`, with an optional Violet topic `icon` and optional trailing `meta`. Hover tints the row and shows an arrow.
  - It's used for Try asking, the "Ask next" follow-ups, the Ask drawer and Recent chats.
  - On `/chat`, Try asking and Recent chats sit side by side from md.
- The old glowing pill is now `HaloSuggestion` (`halo-suggestion.tsx`), kept only for the prototypes along with its `.prompt-suggestion` CSS and `--suggestion-*` tokens.
- **Rejected: Chips** (short white chips under a glow-free composer, which filled the box rather than sending). It was calmer still, but it lost the AI feel, and every suggestion took an extra step.
