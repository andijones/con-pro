# Audit: Feed + history

Decided 2 October 2026 from the Audit prototype (`/proto/audit`, now deleted). The brief was "just see what has happened and when", taking inspiration from trails like GitHub's.

## Decision

A GitHub-style trail, where any record name opens that record's full history in a right-hand drawer.

- **Header:** "Audit", one line explaining the trail (including that Contravo staff actions show the reason given), and **Export for auditors**.
- **Search** across people, actions and records. **Filters** use the design system `ToggleGroup`: Everything, People, Contravo and Changes only.
- **Days as headings,** for example "Today 3", "Yesterday 13" or "Monday 28 September 5". Events are newest first.
- **One sentence per event** on a vertical trail:
  - an icon node for the kind of event (viewed, edited, uploaded, assigned, asked, FOI, status change, Contravo, staff, deleted, exported)
  - the person's face, or Contravo's icon
  - for example, "**Priya Shah** changed the review date on **Car park management**"
  - the time and "how long ago" on the right, with the full timestamp on hover
- **Edits show before → after:** the old value struck through on a red tint, then the new value on a green tint.
- **Runs fold:** the same person changing the same record back to back becomes "Priya Shah made 3 changes to Car park management", with "Show the 3 changes".
- **Contravo staff actions** keep their reason, in an amber callout.
- **History drawer** (`Sheet`, right side, up to 32rem wide). Clicking a contract or FOI name anywhere opens it. It shows:
  - "Contract history" or "FOI request history" and the record name
  - the event count, last and first activity, and the faces of everyone involved
  - **Open contract** or **Open request**
  - the record's full trail, newest first, with exact timestamps and before-and-after values

  Closing it returns focus to the name you clicked. The drawer is opened from state rather than its own trigger, so focus is restored by hand. The same fix went into the Contracts preview.
- **Model:** `src/lib/audit-trail.ts` turns the raw trail into events (kind, record, before and after). It also adds concept history (earlier edits, overnight checks, an export, FOI steps), so the trail reads like a real workspace's.

## Removed

- **The 4-column table** (Who, What happened, Action, When).
- **The action dropdown and date-range picker:** replaced by search, the four filters and day headings.
- **`auditActions` and `auditActionOf`** in `data.ts`: replaced by the event kinds in `audit-trail.ts`.

## Rejected

- **Current:** each row needed reading across four columns, edits showed no before and after, and it didn't read as a story.
- **Feed on its own:** great for "what happened lately", but weak at "what happened to this contract?"
- **By record** (a list of records with the history beside it): the strongest per-record answer, but you had to know which record you were looking for. It's now the drawer.
- **Day by day** (a calendar shaded by activity, plus swimlanes of people across the hours of a day, with the day told as a story): the most distinctive, and good for spotting unusual activity. It was the least direct way to find a single event. Worth reviving as an "activity" view for administrators.

## Update, 7 October 2026: "Index" layout

Decided from `/proto/audit`, which is kept. The page felt wide and hard to take in: the trail ran about 1,000px wide with each event's time pinned at the far right, and 43 events sat under 13 day headings.

- **One readable column,** at most 46rem wide. Each event reads time → who → what on one line: the time (`08:42`) sits in a 3rem left gutter, with the full timestamp and "how long ago" on hover, then the trail line and icon node, then the face and sentence. Before → after, staff reasons and folded runs ("Show the 3 changes") sit under the sentence as before.
- **A sticky rail on the left** (14rem, from `lg`) holds:
  - search ("Search the trail")
  - **Show**: Everything, People, Contravo or Changes only. These are a list of toggle buttons with `aria-pressed`, replacing the toggle group.
  - **Days**: a jump-to-day list with counts, which scrolls on its own if it's long
- **Day headings stay pinned** under the page bar while you read that day.
- **Below `lg`,** the rail stacks above the trail: search, then the Show buttons in a row. The Days list is hidden.
- **The intro is shorter:** "…Select a contract or request to see its whole history. Anything Contravo staff do shows the reason they gave."
- **Unchanged:** the history drawer, focus returning to the name you clicked, Export for auditors, and the event model (`audit-trail.ts`).

**Rejected, still in `/proto/audit`:**
- **Column:** the same reading column without the rail. Easier to read, but it left the right of wide screens empty and gave no way to get to a day.
- **Digest:** week cards with one-line rows and details behind a toggle. Fastest to scan and about 25% shorter, but before → after and staff reasons were hidden until opened, and it read less like a story.
