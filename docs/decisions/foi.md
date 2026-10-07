# FOI requests: Paced

Decided 2 October 2026 from the FOI prototype (`/proto/foi`, now deleted). It's built for a busy officer who needs to know three things about each request: where it is, whose move it is, and whether it will make the 20 working days (FOI Act 2000, s.10).

## Decision

Each request is a card that leads with the next thing to do. Cards are grouped by whose move it is, and each carries its 20-working-day clock with the target pace marked.

- **Header:** "FOI requests", one line saying how many requests need you, and **New request**.
- **Sections,** in this order:
  - **Your move:** the officer has to act. These are raised white cards with a filled primary button.
  - **Waiting on someone else:** Contravo is searching, or the request is with the reviewer. These are Frost cards with an outline button.
  - **Sent:** shown only when there are any.

  Within each section, cards sort by days left.
- **Card,** left column:
  - days left in words ("14 days left", "Due today", "3 days overdue")
  - the due date
  - a pace `Badge`: On track (success), Behind (warning), Overdue (critical) or Sent (secondary)
- **Card,** main column:
  - subject, reference number and requester, in small grey text
  - the **next action** as the heading, for example "Check the draft. One issue stops it being sent."
  - the **pace bar:** 20 segments, filled to today's working day, with black marks at the target days
  - the blocking issue in full, once a draft exists, plus a count of things to check
  - one action button, and "Whose move" with a face, or a robot icon for Contravo
- **Pace bar** fill colour: iris when on track, amber when behind, red when overdue. The line under it says, for example, "Day 10 of 20. Next target: in sign-off by Fri 9 Oct" or "Behind: should be at 'in sign-off' by now".

## Pace rule

| Target | Working day | Stage the request should have reached |
|---|---|---|
| Search done | 3 | Confirm scope |
| Draft ready | 10 | Check draft |
| In sign-off | 16 | Sign-off |
| Sent | 20 | Sent (the legal deadline) |

A request is **Behind** when its stage is earlier than the target for today's working day. It's **Overdue** once the due date (working day 20) has passed. Logic lives in `src/lib/foi-lifecycle.ts`.

## Rejected

- **Current** (a big countdown, 20 day markers, a status badge and the request text): showed only time left. It didn't say whose move it was, whether the request was on pace, or what was blocking it.
- **Pipeline** (one column per stage): good for spotting a pile-up, but you still had to scan for your own work, and columns got narrow.
- **Next** (the same cards with a six-step stepper): clear about the action, but the stepper showed position without pace.
- **Clock** (every request's 20 days on one shared calendar): the best picture of the legal deadline and of deadlines bunching up, but too abstract to read in a hurry.
- **To do** (only your tasks, one plain line each, with late requests held by others becoming "chase" tasks and everything else folded away): the fastest to read. It's a strong candidate for the top of this page or for Home if busy officers still find Paced too much. It hides the overall workload.

## Not carried over

The prototype added four sample requests: one being searched, one waiting on the requester with the clock paused, one overdue in sign-off, and one sent. They have no full case behind them, so the live page shows the real requests only.

`FoiStatus` has no state for clarification yet. When it's added, show the clock as paused (the requester has been asked to clarify, so the 20 days stop) and put it under "Waiting on someone else".

## Update, 7 October 2026: working days, a separate reviewer, clarification, sent

- **Working days everywhere.** Each card now gives the time left in working days, for example "10 working days left", "Due today" or "2 working days overdue". The list used to count calendar days ("14 days left") while the case page counted working days, so the same request showed two different numbers. The Act counts working days. `FoiView.workingLeft` replaces `daysLeft`.
- **A separate reviewer.** Each request has its own `reviewer`, and the seed data uses Helen Price, Senior Information Risk Owner. The "Signs it off" picker leaves out the officer who drafted the reply (`canSignOff`). The flow is: **Send for sign-off**, then **Approve as {reviewer}**, then **Mark as sent**. "Approve" is blocked while any blocking note is open. This replaces the hard-coded Information Governance lead, who was also the drafting officer, so they had been signing off their own work.
- **Ask the requester to clarify** (FOI Act s.1(3)).
  - Available from the clock card at any stage before sign-off.
  - Contravo drafts the question from its advice. The officer sends it from their own mailbox, copies it if needed, then confirms with "I've sent it. Stop the clock".
  - The request moves to "Waiting on someone else", where it shows "Clock stopped", an outline "Waiting for requester" badge and the date it was asked. It sorts last.
  - **Record their reply** restarts the clock: day 1 is the working day after the reply arrived. The original date received is kept and shown, with "clock restarted {date}".
  - New status: `Awaiting clarification`. There's no due date while the clock is stopped, so it's left out of the calendar and Home.
- **Mark as sent** records the date it went out, with a date picker. That stops the clock: the working day count is fixed at the send date. The request moves to Sent, and the case page shows the last date the requester can ask for an internal review (40 working days).
- Every change offers Undo, with no time limit.

**How state is kept.** The concept has no back end. Changes made on a case page go into `sessionStorage` through `src/lib/foi-store.ts`, and both the list and the case page read from it, so they stay in step. The server renders the seed data, and the browser applies the session's changes straight after loading.
