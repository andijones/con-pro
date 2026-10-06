// Throwaway: /proto/palette token overrides. Tailwind slate: 50 #f8fafc · 100 #f1f5f9 · 200 #e2e8f0 · 300 #cbd5e1 ·
// 400 #94a3b8 · 500 #64748b · 600 #475569 · 700 #334155 · 900 #0f172a.
// Contrast (WCAG): slate-600 text 7.58:1 on white, 6.92:1 on slate-100. Control edge #8592a6 (between slate-400 and 500)
// 3.15:1 on white, the 3:1 that 1.4.11 needs (slate-400 alone is 2.56:1 and fails).

/** Shared: neutrals become slate; Lilac stays for active nav, secondary buttons and the AI moments */
const surfaces = `
:root {
  --brand-frost: #f1f5f9;           /* slate-100: muted wells, hovers, the app background behind the panel */
  --brand-line: #e2e8f0;            /* slate-200: dividers */
  --brand-line-strong: #8592a6;     /* control edges, 3.15:1 */
  --brand-slate: #475569;           /* slate-600: secondary text */
  --muted: #f1f5f9;
  --muted-foreground: #475569;
  --accent: #f1f5f9;                /* menu and row hovers: grey, not lilac */
  --accent-foreground: var(--foreground);
  --border: #e2e8f0;
  --highlight: #f1f5f9;             /* "What happens next" style callouts */
  --sidebar: #f1f5f9;
  --sidebar-border: #e2e8f0;
  --sidebar-accent: #e2e8f0;        /* sidebar hover and the count pills: slate-200 */
  --sidebar-accent-foreground: var(--foreground);
}
/* Active nav keeps the brand: Lilac fill, Violet text */
[data-sidebar="menu-button"][data-active="true"] {
  background-color: var(--brand-lilac);
  color: var(--brand-violet);
}
`;

export const slateSurfaces = surfaces;

/** As above, and the ink and shadows go slate too: Midnight text becomes slate-900, shadows lose their navy tint */
export const slateInk =
  surfaces +
  `
:root {
  --foreground: #0f172a;
  --card-foreground: #0f172a;
  --popover-foreground: #0f172a;
  --sidebar-foreground: #0f172a;
  --elevation-0: 0 0 0 1px rgb(15 23 42 / 0.08);
  --elevation-1: 0 0 0 1px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.05), 0 2px 6px -2px rgb(15 23 42 / 0.06);
  --elevation-2: 0 0 0 1px rgb(15 23 42 / 0.06), 0 1px 2px rgb(15 23 42 / 0.05), 0 4px 12px -4px rgb(15 23 42 / 0.09);
  --elevation-3: 0 0 0 1px rgb(15 23 42 / 0.08), 0 4px 8px -2px rgb(15 23 42 / 0.08), 0 16px 32px -8px rgb(15 23 42 / 0.18);
  --elevation-4: 0 0 0 1px rgb(15 23 42 / 0.08), 0 8px 16px -4px rgb(15 23 42 / 0.1), 0 32px 64px -16px rgb(15 23 42 / 0.28);
  --edge-hairline: inset 0 0 0 1px rgb(15 23 42 / 0.12);
  --shadow-button: 0 0 0 1px rgb(15 23 42 / 0.12), 0 1px 2px rgb(15 23 42 / 0.06);
  --shadow-button-hover: 0 0 0 1px rgb(15 23 42 / 0.18), 0 1px 3px rgb(15 23 42 / 0.08), 0 2px 6px -2px rgb(15 23 42 / 0.08);
  --control-shadow: inset 0 1px 2px rgb(15 23 42 / 0.06);
  --page-bar-shadow: 0 1px 0 rgb(15 23 42 / 0.04), 0 6px 12px -10px rgb(15 23 42 / 0.06);
}
`;

/** The palette before Slate went live (6 October 2026): Frost and Lilac-tinted neutrals */
export const frost = `
:root {
  --brand-line: #e3e1ee;
  --brand-line-strong: #8c88ad;
  --muted: #f5f4fa;
  --muted-foreground: #5c5b70;
  --accent: color-mix(in oklab, #e8e3ff 55%, #ffffff);
  --border: #e3e1ee;
  --sidebar: #f5f4fa;
  --sidebar-border: #e3e1ee;
  --sidebar-hover: #e8e3ff;
}
`;
