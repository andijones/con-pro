# Palette: Slate surfaces

Decided 6 October 2026 from `/proto/palette` (kept). The app felt lilac-heavy because every grey was tinted lilac.

## Decision

Surfaces use Tailwind **slate** as a neutral scale. The brand purples are kept for things that mean something: primary and secondary buttons, the active nav item, selection and highlights, focus and the AI moments. Text stays brand Midnight, and shadows keep their Midnight tint.

| Token | Before | Now |
|---|---|---|
| `--muted`, `--sidebar`, `--accent` (hovers) | Frost `#f5f4fa`, hover a Lilac mix | `--neutral-100` slate-100 `#f1f5f9` |
| `--muted-foreground` | Slate `#5c5b70` | `--neutral-600` slate-600 `#475569`: 7.58:1 on white, 6.92:1 on slate-100 |
| `--border`, `--brand-line`, `--sidebar-border` | `#e3e1ee` | `--neutral-200` slate-200 `#e2e8f0` |
| `--input`, `--brand-line-strong` | `#8c88ad` | `#7e8b9f`, between slate-400 and 500: 3.45:1 on white, 3.15:1 on slate-100 (WCAG 1.4.11) |
| `--sidebar-hover` (new) | used `--sidebar-accent` (Lilac) | `--neutral-200`, for the sidebar's hover state and count pills |
| `--sidebar-accent` | Lilac | `--neutral-200`, the same as hover (changed later on 6 October 2026), with Midnight text |
| `--highlight` | Lilac | Lilac: calendar selection, the current FOI step, cited text, the focused review field, drag-over |

The brand primitives (`--brand-frost`, `--brand-slate`, `--brand-lilac`) still exist for brand moments and charts. Surfaces no longer use them.

**Sidebar hover and active share slate-200** (6 October 2026, from a screenshot of the hover state). The active link carries `aria-current="page"` for screen readers, and its count pill turns white so it stays visible.

## Rejected

- **Frost (before):** Lilac-tinted greys everywhere, so purple stopped meaning anything.
- **Slate all through:** body text in slate-900 and shadows tinted slate. The most neutral option, but it lost the brand's navy undertone and looked like any SaaS app. You can still see it in `/proto/palette`.
