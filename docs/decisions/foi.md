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
