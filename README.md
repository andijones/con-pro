# Contravo: platform concept

A personal UX exploration of the Contravo SaaS platform. It's separate from the team's staging environment, and every screen runs on illustrative sample data with no backend.

```bash
npm run dev
```

Then open http://localhost:3000. The design system lives at http://localhost:3000/design-system.

## Screens

| Route | What it is | Live platform equivalent |
| --- | --- | --- |
| `/` | Home: a list of decisions ranked by deadline, a 90-day strip, FOI clocks, and the workspace counts (assigned, details to check, by status, recently added) | Home |
| `/contracts` | Register: search, filters for status, type, owner, business unit and counterparty, sortable columns, Export CSV, Upload, row actions | Contracts |
| `/contracts/[id]` | Contract: deadline first, flags, decisions, plain-English clauses next to the document | (new) |
| `/contracts/[id]/review` | Step 1, "Review what the AI read": confidence, show in document, history, edit, accept | Review step 1 |
| `/contracts/[id]/details` | Step 2, "Add what the AI couldn’t": owner, business unit, counterparty, review date, submit for review | Review step 2 |
| `/timeline` | Notice windows and renewals up to 2028 | (new) |
| `/reports` | Charts built from the contracts, with every exclusion listed, plus a report library | Reports |
| `/chat` | "Ask a question" with citations, plus the "FOI request" tab | Chat |
| `/foi`, `/foi/[id]` | FOI agent: 20-day clock, searches, scope, draft, officer notes | FOI (inside Chat) |
| `/audit` | Filter by action and date range; Contravo staff actions show the reason they gave | Audit |

## Design system: one source of truth

The design system is shadcn/ui (`radix-nova`, Radix primitives) themed with Contravo's brand tokens. Colour comes in three layers, all in `src/app/globals.css`:

1. **Brand primitives** come from the brand guidelines, e.g. `--brand-violet: #4025c8`.
2. **Semantic tokens** are the shadcn contract and point at the primitives, e.g. `--primary: var(--brand-violet)`.
3. **Tailwind utilities** (`@theme inline`) give you classes such as `bg-primary` and `text-muted-foreground`.

Components read only semantic tokens. Change a primitive and every token that uses it updates, and every screen with it.

`/design-system` shows every token, contrast ratios, type, radius and all the components. It also has a live editor. Changes there apply across the app in your browser only, and **Copy CSS** gives you the lines to paste into `globals.css`.

## Standing rules

- **Light only.** There's no dark mode. Don't add `.dark` tokens or a theme toggle.
- **WCAG 2.2 Level AA** is required because this is public sector work. The rules and where each is handled are listed on `/design-system#accessibility`, and the contrast checks there run live against the tokens. Before shipping a screen, run axe-core on it with the `wcag2a`, `wcag2aa`, `wcag21aa` and `wcag22aa` tags.

## Code layout

- `src/components/ui/*`: shadcn source, as generated. Re-add with `npx shadcn@latest add <name> -o`. Local changes are marked with a `Contravo` comment: status variants on `Badge`, a fixed locale in `Calendar`, `Sonner` fixed to light, the slider thumb label and a stronger track, and `scrollLabel` on `Table`.
- `src/components/contravo/*`: Contravo components built from shadcn parts (countdown, clause link, decision card, review workspace, and so on).
- `src/lib/*`: sample data (`data.ts`, `extraction.ts`, `foi-cases.ts`, `answers.ts`) and date helpers. "Today" is fixed at 1 October 2026 so the sample data stays consistent.
