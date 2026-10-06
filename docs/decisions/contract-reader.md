# Contract reader: Risk map

Decided 6 October 2026 from the reader prototype (`/proto/reader`). The other concepts (Original, Brief and Annotated) **stay in the prototype folder** so they can be revisited. Plain-English reading is one of Contravo's main features, so the brief was: make the highlights obvious, make the whole document easy to scan, and use risk badges.

## Decision

One scroll through the whole agreement (`components/contravo/contract-reader.tsx`).

- **Heading:** "What the contract says · in plain English", unchanged.
- **Summary card:**
  - **Normally:** "Contravo read all 8 clauses. 6 need your attention."
  - **When pages are missing:** "Contravo read the 1 clause on the 20 pages it holds." It never claims to have read everything when it hasn't.
  - **The file:** its name, plus the page count or a "20 of 84 pages held" warning badge.
- **Highlights, not filters** (design-system `ToggleGroup`): "All risks · 6" and one per risk level that's present: "High risk · 2", "Medium risk · 2", "Low risk · 2".
  - **The whole contract is always on screen.** An earlier version hid clauses that didn't match, and it was changed the same day.
  - Picking a level keeps those clauses tinted with their coloured edge. Other flagged clauses lose the tint but keep their badge and plain English.
  - The page scrolls to the first clause at that level, focuses it and outlines it.
- **Flagged clauses** are impossible to miss:
  - tinted by risk, with a 4px edge in the risk colour
  - the design-system `Badge` (critical, warning or success), always with the words "High risk", "Medium risk" or "Low risk"
  - the heading and clause number
  - the plain-English meaning in medium weight
  - the original wording beneath it in the document typeface
  - where a decision on this contract cites the clause, "Needs a decision: …" linking to that decision card on the page
- **Unflagged clauses:** quiet document text with the clause number and heading. The closing line says they were read and nothing was flagged, or that clauses on missing pages haven't been read.
- **The map:** a slim column beside the document from md up.
  - One notch per clause, in document order, sticky under the page bar.
  - Flagged clauses are 24px coloured marks (red, amber or green), each a button labelled with its risk and heading. Pressing one clears the filter, then scrolls to that clause and focuses it.
  - Unflagged clauses are short grey ticks, so you can see where the risks fall across the whole agreement.
- **Citations** (`?clause=`): after navigation finishes, the cited clause scrolls into view, takes focus and gets a 2px Violet outline. It's a box-shadow, because the global focus rule removes ring shadows from focused elements.
- **No clauses extracted:** the existing empty state with "Upload signed copy".
- **Removed:** the separate scrolling document panel and the plain-English cards on the left. The document is now the page.

## Kept as prototypes (not rejected)

- **Original:** cards on the left, the document in its own scroll box on the right.
- **Brief:** plain English first, grouped by topic, with the wording on request. Unflagged clauses fold into a count per topic. The most digestible for people who never read legal text.
- **Annotated:** contents with a risk dot per part, plus the document with notes in the margin and Previous risk and Next risk buttons. The best for reading properly or auditing.

The prototype's topics, per-clause actions and 24 filler clauses exist only in `/proto/reader/doc.ts`. Building Brief or Annotated for real would need topics added to the clause data.
