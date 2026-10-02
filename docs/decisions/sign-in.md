# Sign-in: Frost page, white card, brand shimmer

## Current decision (2 October 2026)

Decided from a two-option prototype (`/proto/sign-in`, now deleted).

- **Page:** Frost (`bg-muted`). The Contravo logo is centred just above the card.
- **Card:** white, 420px wide, 2xl radius, with `--shadow-raised` (a hairline ring, a contact shadow and a soft ambient shadow). It holds the "Sign in" heading and the form. There's no subheading.
- **Shimmer:** the `shimmer-band` utility, ported from the website's hero band. The `--shimmer` ramp (Lilac → deep Lilac → Mint → Mint mist) fills a band at the foot of the page, fading in from the top and softening at the sides. It drifts sideways on a 12-second loop using transform only, stops for reduced motion, and is `aria-hidden`.
- **Footer:** the trust line and the Privacy and Get help links are centred at the bottom in Midnight at 80%. Muted grey dropped to about 3.9:1 over deep Lilac, and Midnight at 80% stays above 4.5:1.
- **Forgot password** uses the same shell and keeps its one-line instruction.
- **Design-system fixes made alongside:**
  - Solid buttons (`default` and `secondary`) use `bg-clip-border`. Before this, the transparent 1px border let the page show through as a pale ring.
  - `--shadow-button-primary` no longer has an inset white highlight.
  - Programmatic focus targets (`tabindex="-1"`, such as a page's `<main>` or a heading focused after a view change) no longer draw the focus ring.

## Rejected

- **White page, Frost card:** cleaner, and the shimmer stood out more against white, but the card was less raised and the page lost the brand tint.
- **Shimmering wordmark** (the website footer's giant "contravo" letters): read as decoration rather than atmosphere. The user wanted the colour glow, not the type.
- **Evidence panel** (a split layout with a demo of an answer and its clause): read as marketing on a screen people pass through daily.
- **"Use your NHS or council work email":** added nothing the "Work email" label didn't already say.

## Original decision (superseded)

The first version, kept for the record:

Decided 2 October 2026 from the sign-in prototype (`/proto/sign-in`, now deleted).

## Decision

The sign-in page shows what the product does instead of a slogan.

- **Layout:** the form sits on the left (max 380px wide). On desktop, the right panel shows Evidence, on a Frost background with the emblem pattern at 5%. Phones get the form only.
- **Evidence panel:** an example question, then an answer with a citation number, then the clause card. In the clause, the sentence the answer is based on gets the same `clause-mark` highlight as the contract reader. The panel is labelled "Example", and its last line is "Every answer shows the clause it came from, so you can check it before you act."
- **Motion:** each step fades in and rises 8px, starting at 400ms, 1300ms, 2300ms and 3200ms. Each uses `--ease-out` over 300ms.
  - It plays once and finishes within 5 seconds, so WCAG 2.2.2 needs no pause control.
  - With reduced motion, it shows the final frame straight away.
  - The panel sits in the `(auth)` layout, so it doesn't replay when you move between sign-in and forgot password.
  - It's `aria-hidden`.
- **Sign-in form:** work email, password with a show/hide toggle, "Keep me signed in for 30 days" (ticked by default), and Sign in. There's no SSO button.
  - Errors appear inline under each field, and focus moves to the first invalid field.
  - The email is kept after a failed submit.
- **Forgot password:** a real route at `/forgot-password`.
  - It's prefilled with any email already typed on sign-in. The email is passed through sessionStorage, never the URL.
  - Submitting shows "Check your email" with copy that doesn't say whether an account exists, plus a "send it again" link and "Back to sign in".
- **Focus:** on first load, the browser keeps its normal focus. After that, each new view (navigating, or switching to the sent state) moves focus to its `h1`, so focus never falls back to `<body>`.

## Rejected

- **Document** (the form set as a contract page, with numbered clauses in the margin, a serif title and "Page 1 of 2"): distinctive, but there was a risk it read as terms you have to agree to, and the metaphor didn't help anyone sign in faster.
- **Steps** (identifier first: email, then a "Welcome back" email card, then password; reset reuses the email): the fastest reset, and ready for SSO routing. Rejected for now because it adds a step and depends on a hidden username field for password managers. Worth revisiting when real SSO arrives.
- **Brand gradient panel** (the first sign-in): Iris to Violet with "Every agreement. Clearer decisions." It looked handsome, but it only repeated the slogan. Evidence shows the promise working.
- **"Continue with NHSmail":** not a real option. Removed.
