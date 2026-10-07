# Reports: statutory publications (7 October 2026)

The page used to show a library of reports I'd invented (register, spend, savings, "procurement pipeline") plus charts.
Only the primer's one line ("spend, renewals and supplier performance") backed it. It now lists what an NHS trust has
to publish, when each one is due and the rule behind it. Rules and calculations: `src/lib/statutory.ts`.

- **Due in the next 3 months / Later:** dated items, worked out from the contracts.
  - Each row: the date, the rule, and a plain status (ready / needs input / nothing yet).
  - "Prepare draft" appears only where there's something to draft.
- **Everything the trust publishes:** one row per duty: what it contains, the rule, who it applies to, how often, and the deadline.
- **Duties covered:**
  - spend over £25k (HM Treasury guidance, monthly)
  - the Procurement Act 2023: payments compliance (s.69), payments over £30k (s.70), contract details (s.53), contract performance (s.71), pipeline (s.93), change (s.75) and termination (s.80) notices
  - the PSR annual summary (reg. 25)
- **Honest about data:**
  - Contravo holds contracts, not invoices, so the payment-based notices say they need Finance's ledger.
  - Unsigned contracts say their date assumes signing on the start date.
- **Scope rule:** health care services under the PSR are outside the Act; a contract counts as under the Act if it started on or after 24 February 2025.
- **Data fix:** the catering contract (started January 2025) was labelled "Open procedure (Procurement Act 2023)". That's impossible before the Act went live, so it's now "Open tender (PCR 2015)".
- **Sources:** GOV.UK Procurement Act short guide and guidance collection, NHS England PSR statutory guidance, checked on 7 October 2026. The page links to them and says it isn't legal advice.
- **Removed:** the value-by-category and renewals charts, Largest suppliers and Money found. They're internal analysis, not publications, and Home and Timeline already cover them.
  - `report-charts.tsx` is kept, unused, in case they come back as an internal view.
