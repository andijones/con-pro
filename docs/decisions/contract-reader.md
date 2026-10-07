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

## Update, 7 October 2026: the full contract and the navigator rail

Decided from `/proto/risk-map`, which is kept.

- **The whole agreement, where we hold it.** The reader shows every clause in order, part by part, with small part headings ("7 Charges and payment"). Flagged clauses sit in place among the unflagged ones. The full text comes from `src/lib/contract-documents.ts` (`documentFor`). The concept holds the imaging contract in full (32 clauses, 6 flagged). Other contracts still show their extracted clauses, and the summary stays honest ("Contravo read all 3 clauses", or "the clauses on the 12 pages it holds" when pages are missing).
  - **Why:** "Read all 3 clauses" for a 41-page PDF undersold the reading. The map is only useful when risks are spread through a long document.
- **Navigator rail replaces the capsule map.** It's a slim, sticky, rounded rail to the right of the contract, from `md` up:
  - **Arrows:** up and down step to the previous or next highlighted risk.
  - **Counter:** "3 of 6". Screen readers hear the level, heading and clause number, announced politely.
  - **Stops:** one per risk, in document order, on a thin track. The one you're reading grows into a pill with a Violet focus-edge ring. Stops are sized by level (high largest) as well as coloured, so colour is never the only signal, and each is a 28px target with a text label.
- **"Current" follows your reading.** It's the flagged clause across the middle of the screen, otherwise the nearest one in view. After a jump, the target stays current until the smooth scroll settles, so the counter never names the wrong clause.
- **Phones:** the rail hides, and a compact sticky bar under the contract does the same job: "‹ › 3/6 · Medium risk · VAT".
- **Highlight chips stay** (All risks, High, Medium, Low). They highlight clauses rather than hide them, and they also decide which risks the navigator steps through.

**Rejected, still in `/proto/risk-map`:**
- **Minimap:** a document-length strip with marks at their real positions and a "you are here" window. It shows best where risks cluster, but the marks have no labels without hovering, and it can't step through risks in order.
- **Index:** a labelled list of the flagged clauses. Best for finding a clause by name, but it needs a wide screen (only from `xl`), so there was no map on laptop or phone widths.
- **Navigator (horizontal):** a sticky bar under the document. It's clear, but it sits over the text and takes the bottom of the screen. It's kept as the phone fallback.
