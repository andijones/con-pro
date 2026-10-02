import { ComponentGallery } from "@/components/contravo/component-gallery";
import { gallerySections, slug } from "@/components/contravo/gallery-sections";
import { TokenEditor } from "@/components/contravo/token-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Design system" };

const type = [
  { name: "Display", spec: "48–72px · Regular · −4% tracking · campaigns and greetings", className: "text-5xl tracking-[-0.04em] leading-[1.02]", sample: "Every agreement. Clearer decisions." },
  { name: "Page title", spec: "30px · Regular · −2.5% tracking · .page-title", className: "page-title", sample: "Know what needs attention." },
  { name: "Section", spec: "18px · Medium · −1% tracking", className: "text-lg font-medium tracking-[-0.01em]", sample: "Give notice on the imaging contract" },
  { name: "Body", spec: "16px · Regular · 155% leading · up to 65 characters", className: "max-w-[65ch] text-base leading-[1.55]", sample: "Review contract details, track renewal dates and keep the evidence close to every decision." },
  { name: "UI", spec: "14px · Regular · component default", className: "text-sm", sample: "Ask about any contract" },
  { name: "Label", spec: "13–14px · Medium · tabular figures for values, dates and totals", className: "tnum text-[13px] font-medium", sample: "Contract overview £124,800.00 · 17 Oct 2026" },
  { name: "Caption", spec: "12px · Regular · muted", className: "text-xs text-muted-foreground", sample: "Estimates. Finance confirms each one before it counts." },
  { name: "Document", spec: "Georgia 14px · 170% leading · contract text only · font-document", className: "font-document text-[14px] leading-[1.7]", sample: "3.2 Extension. Upon expiry of the Initial Term this Agreement shall automatically extend for successive periods of twelve (12) months." },
];

const a11y: [string, string, string][] = [
  ["1.4.3", "Text contrast at least 4.5:1, including placeholders and small labels.", "Semantic tokens; checked live in Contrast below"],
  ["1.4.11", "Control borders, focus indicators, selected states and chart marks at least 3:1.", "--input #8c88ad, --focus Midnight, --control-focus-edge Violet, chart tokens"],
  ["1.4.1", "Never use colour alone. Status has a label or icon, risk is spelled out, inline links are underlined, and chart markers differ in shape.", "StatusBadge, ToneBadge, ContractReader, Runway key"],
  ["2.4.7 · 2.4.11", "Keyboard focus is always visible and never hidden behind the phone menu bar. Outlines are Midnight; fields take a single 1px Violet edge (9:1) with a soft glow.", "--focus, :focus-visible, control-focus, scroll-padding-top"],
  ["2.4.1", "Skip link to main content on every page.", "layout.tsx"],
  ["2.5.8", "Pointer targets at least 24 × 24px. We go further: every small control grows an invisible target to 40px (44px on touch), and targets never overlap.", "--hit-min + hit-area / hit-area-y utilities in Button"],
  ["2.5.7", "Anything you can drag also works with a single click.", "Upload drop zone is a button; sliders accept clicks and arrow keys"],
  ["2.2.1", "No time limits on actions. Undo toasts stay until dismissed.", "toast({ duration: Infinity }) + close button"],
  ["3.3.1 · 3.3.2", "Forms explain what’s missing in words next to the field, and submit buttons stay enabled.", "Field + FieldError, aria-invalid"],
  ["3.2.6", "Help is in the same place on every page.", "User menu (bottom of sidebar): Help and support"],
  ["3.3.7", "Don’t ask for the same information twice.", "Review step 2 pre-fills what step 1 read"],
  ["4.1.2", "Every control and avatar has an accessible name.", "aria-label on icon buttons; PersonAvatar role=img"],
  ["4.1.3", "Results counts, progress and loading states are announced.", "role=status on counts, progress and “Reading…”"],
  ["1.1.1", "Charts carry the same data as a table for screen readers.", "report-charts.tsx SrTable"],
  ["1.4.10", "Reflows to 320px without horizontal scrolling, except data tables.", "Responsive grids; tables scroll in their own container"],
  ["2.3.3", "Motion respects reduced-motion settings.", "globals.css prefers-reduced-motion"],
];

const interaction: [string, string, string][] = [
  ["--focus", "Midnight #030139", "Keyboard focus outline (2px, 2px offset)"],
  ["--control-focus-edge", "Violet #4025c8", "Field focus edge (1px, 9:1 on white) inside an 18% Iris glow"],
  ["--duration-fast", "150ms", "Hover, colour and border changes"],
  ["--duration-base", "200ms", "Progress bars and larger state changes"],
  ["--ease-out", "cubic-bezier(0.22, 1, 0.36, 1)", "All UI transitions. Named properties only, never transition: all"],
  ["--press-scale", "0.96", "Tactile press on buttons and toggles (the press utility)"],
  ["--hit-min", "40px (44px on touch)", "Invisible target size for small controls (hit-area, hit-area-y)"],
  ["--control-height", "36px", "Default height of buttons, inputs and selects"],
  ["--control-border", "--input · 3.37:1", "Field boundaries (control utility)"],
  ["--z-sticky / --z-header / --z-overlay / --z-skip", "10 / 20 / 50 / 60", "The only z-index values allowed"],
  ["--composer-radius · --composer-shadow", "16px · two Midnight layers", "Prompt composer shape and lift"],
  ["--composer-frost / --composer-solid", "Card at 90%→84% / Card", "Composer surface; frost keeps muted text above 4.5:1"],
  ["--composer-rim-1…3 · --composer-aurora-1…2", "Iris, deep Lilac, --halo-mint", "Moving rim and background glow (decorative, aria-hidden)"],
  ["--composer-avatar-1…5", "deep Lilac, Violet, Mint, Iris, Lilac", "Colours for the avatar's WebGL shader, read at runtime"],
  ["--composer-divider", "--brand-line", "Rule above the composer's actions"],
  ["--suggestion-radius · -stacked", "pill · 14px", "Prompt suggestion shape (wrapped / stacked in the drawer)"],
  ["--suggestion-surface · -hover", "--composer-frost · 94%→88% Card", "Suggestion fill; the label stays Midnight on 84%+ white"],
  ["--suggestion-rim-rest / -active", "0.55 / 1", "Rim glow at rest, and on hover or keyboard focus"],
];

const nav = [
  { id: "principles", label: "How it works" },
  { id: "accessibility", label: "Accessibility" },
  { id: "tokens", label: "Colour tokens" },
  { id: "typography", label: "Typography" },
  { id: "radius", label: "Radius and elevation" },
  { id: "interaction", label: "Interaction tokens" },
  ...gallerySections.map((s) => ({ id: slug(s), label: s })),
];

export default function DesignSystemPage() {
  return (
    <div className="grid gap-10 lg:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="Design system sections" className="hidden lg:block">
        <ul className="sticky top-8 flex flex-col gap-0.5 text-sm">
          {nav.map((n, i) => (
            <li key={n.id}>
              {i === 6 && <p className="mt-4 mb-1 px-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">Components</p>}
              <a href={`#${n.id}`} className="block rounded-md px-2 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                {n.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="flex min-w-0 flex-col gap-14">
        <header id="principles" className="scroll-mt-20">
          <p className="mb-2 text-[13px] font-medium text-muted-foreground">Contravo × shadcn/ui</p>
          <h1 className="page-title">Design system</h1>
          <p className="mt-3 max-w-[68ch] text-base text-muted-foreground">
            Every screen is built from stock shadcn/ui components, themed with Contravo’s brand tokens. There is one source of truth:
            change a token and the whole platform changes with it.
          </p>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {[
              ["1 · Brand primitives", "--brand-violet: #4025c8", "Colours from the brand guidelines. Change these to rebrand."],
              ["2 · Semantic tokens", "--primary: var(--brand-violet)", "The shadcn contract (primary, muted, border…). Change these to re-map roles."],
              ["3 · Components", "bg-primary text-primary-foreground", "shadcn source in components/ui reads only semantic tokens. No hex values."],
            ].map(([t, code, d]) => (
              <Card key={t} size="sm">
                <CardContent className="flex flex-col gap-2">
                  <p className="text-sm font-medium">{t}</p>
                  <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs">{code}</code>
                  <p className="text-xs text-muted-foreground">{d}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Source: <code>src/app/globals.css</code> (tokens) · <code>src/components/ui/*</code> (shadcn, radix-nova style) ·{" "}
            <code>src/components/contravo/*</code> (Contravo composites).
          </p>
        </header>

        <section id="accessibility" className="scroll-mt-20">
          <h2 className="heading mb-1 text-2xl">Accessibility: WCAG 2.2 AA</h2>
          <p className="mb-6 max-w-[68ch] text-sm text-muted-foreground">
            Contravo is used by public bodies, so every screen must meet WCAG 2.2 Level AA (Public Sector Bodies Accessibility
            Regulations 2018). These rules are built into the tokens and components. Follow them for anything new.
          </p>
          <Card className="py-0">
            <Table scrollLabel="WCAG 2.2 AA rules">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-28 pl-4">Criterion</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead className="pr-4">Where it’s handled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {a11y.map(([sc, rule, where]) => (
                  <TableRow key={sc}>
                    <TableCell className="tnum pl-4 align-top text-xs font-medium">{sc}</TableCell>
                    <TableCell className="align-top whitespace-normal">{rule}</TableCell>
                    <TableCell className="pr-4 align-top text-xs whitespace-normal text-muted-foreground">{where}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <section id="tokens" className="scroll-mt-20">
          <h2 className="heading mb-6 text-2xl">Colour tokens</h2>
          <TokenEditor />
        </section>

        <section id="typography" className="scroll-mt-20">
          <h2 className="heading mb-1 text-2xl">Typography</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Instrument Sans in Regular and Medium (600 only for document headings). Sentence case, left-aligned, no artificial bold.
          </p>
          <Card className="py-0">
            {type.map((t, i) => (
              <div key={t.name}>
                {i > 0 && <Separator />}
                <div className="grid gap-2 px-5 py-5 md:grid-cols-[180px_1fr]">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.spec}</p>
                  </div>
                  <p className={t.className}>{t.sample}</p>
                </div>
              </div>
            ))}
          </Card>
        </section>

        <section id="radius" className="scroll-mt-20">
          <h2 className="heading mb-1 text-2xl">Radius and elevation</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            One base radius (<code>--radius</code>, 8px) and multiples of it. Depth comes from five layered, Midnight-tinted shadows
            (<code>--elevation-0</code> to <code>--elevation-4</code>), never from solid borders. Borders only divide (hairlines) or mark a
            control’s edge (inputs and checkboxes, at 3:1).
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              ["rounded-sm", "sm"],
              ["rounded-md", "md"],
              ["rounded-lg", "lg = --radius"],
              ["rounded-xl", "xl · cards"],
              ["rounded-2xl", "2xl"],
              ["rounded-full", "full · badges"],
            ].map(([c, l]) => (
              <div key={c} className="flex flex-col items-center gap-2">
                <div className={`size-20 border-2 border-primary bg-secondary ${c}`} />
                <code className="text-xs text-muted-foreground">{l}</code>
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-4">
            {[
              ["shadow-xs", "elevation-0", "Flat edge · tables, wells"],
              ["shadow-card", "elevation-1", "Cards at rest"],
              ["shadow-raised", "elevation-2", "Raised · hover lift"],
              ["shadow-menu", "elevation-3", "Menus, popovers, tooltips"],
              ["shadow-modal", "elevation-4", "Dialogs, sheets"],
            ].map(([c, t, l]) => (
              <div key={t} className={`flex h-24 w-40 flex-col justify-end rounded-xl bg-card p-3 text-xs ${c}`}>
                <code className="font-medium text-foreground">{c}</code>
                <span className="mt-0.5 text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>

        </section>

        <section id="interaction" className="scroll-mt-20">
          <h2 className="heading mb-1 text-2xl">Interaction tokens</h2>
          <p className="mb-6 max-w-[68ch] text-sm text-muted-foreground">
            The invisible details. Change any of them in <code>globals.css</code> and every component follows.
          </p>
          <Card className="py-0">
            <Table scrollLabel="Interaction tokens">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="pl-4">Token</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="pr-4">Used for</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interaction.map(([t, v, use]) => (
                  <TableRow key={t}>
                    <TableCell className="pl-4">
                      <code className="text-xs">{t}</code>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v}</TableCell>
                    <TableCell className="pr-4 text-xs whitespace-normal text-muted-foreground">{use}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="text-xs text-muted-foreground">Try them:</span>
            <Button>Press me</Button>
            <Button variant="outline">Hover me</Button>
            <Input className="w-56" placeholder="Tab into me" aria-label="Focus demo" />
          </div>
        </section>

        <Separator />
        <ComponentGallery />
      </div>
    </div>
  );
}
