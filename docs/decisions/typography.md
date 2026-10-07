# Typography — DS pass (2026-10-07)

- Big standalone numbers use `.figure-xl/lg/md/sm` (44/32/24/18px): proportional digits plus tracking from −4% to −1.5%.
  Instrument Sans' tabular digits are 18% wider (a "1" takes 60% more room), so `tnum` made headline money look gappy.
- `tnum` stays for figures in columns, tables, pills and anything that ticks.
- Tracking is built into the scale (`--text-lg…5xl--letter-spacing`, −1% to −4%), so pages don't set `tracking-[…]` by hand.
- One-off pixel sizes became named steps: `text-micro` 11px (counts, axes, kbd only), `text-caption` 13px, `text-reading` 15px.
  12px (`text-xs`) is the floor for any sentence.
- `.eyebrow` is the one uppercase group label (11px, medium, +7%). Before this there were four tracking values.
- Underlines: one offset (0.2em, inherited) and the font's own stroke thickness. Per-component offsets were removed.
- `cn` (src/lib/utils.ts) knows the new sizes; every ui component imports it from there.
  Without that, `text-caption` was read as a colour and could drop `text-muted-foreground`.
- Rejected: tightening `tnum` figures with tracking alone. The gaps sit inside the tabular glyph widths, so tracking can't fix them.
