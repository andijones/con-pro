"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { readOverrides, writeOverrides } from "./theme";

export const primitives = [
  { name: "--brand-midnight", label: "Midnight", note: "Primary ink and authority" },
  { name: "--brand-violet", label: "Signal violet", note: "Primary action and emphasis" },
  { name: "--brand-iris", label: "Iris", note: "Gradient light, focus ring" },
  { name: "--brand-white", label: "White", note: "Primary canvas" },
  { name: "--brand-frost", label: "Frost", note: "Brand moments; surfaces use the neutral scale" },
  { name: "--brand-lilac", label: "Lilac", note: "Quiet brand surfaces, highlight" },
  { name: "--brand-slate", label: "Slate", note: "Brand; charts" },
  { name: "--brand-mint", label: "Mint", note: "Positive insight accent" },
  { name: "--neutral-100", label: "Neutral 100", note: "Slate-100: app background, sidebar, muted, hovers" },
  { name: "--neutral-200", label: "Neutral 200", note: "Slate-200: dividers, sidebar hover" },
  { name: "--neutral-600", label: "Neutral 600", note: "Slate-600: secondary text" },
  { name: "--brand-line", label: "Line", note: "Hairlines and dividers (neutral 200)" },
  { name: "--brand-line-strong", label: "Line strong", note: "Input borders" },
  { name: "--status-success", label: "Success", note: "With --status-success-bg" },
  { name: "--status-warning", label: "Warning", note: "With --status-warning-bg" },
  { name: "--status-critical", label: "Critical", note: "With --status-critical-bg" },
];

export const semanticGroups: { title: string; tokens: string[] }[] = [
  { title: "Surfaces", tokens: ["--background", "--foreground", "--card", "--card-foreground", "--popover", "--muted", "--muted-foreground"] },
  { title: "Actions", tokens: ["--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--accent", "--accent-foreground", "--destructive"] },
  { title: "Lines and focus", tokens: ["--border", "--input", "--ring", "--focus", "--highlight"] },
  { title: "Status", tokens: ["--success", "--success-muted", "--warning", "--warning-muted", "--critical", "--critical-muted"] },
  { title: "Charts", tokens: ["--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5"] },
  { title: "Sidebar", tokens: ["--sidebar", "--sidebar-foreground", "--sidebar-primary", "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-hover", "--sidebar-border"] },
];

/** [foreground, background, label, minimum ratio]. 4.5 = text (1.4.3), 3 = UI parts and graphics (1.4.11). */
const contrastPairs: [string, string, string, number][] = [
  ["--foreground", "--background", "Body text", 4.5],
  ["--muted-foreground", "--background", "Secondary text", 4.5],
  ["--muted-foreground", "--muted", "Secondary text on muted", 4.5],
  ["--muted-foreground", "--sidebar", "Secondary text in sidebar", 4.5],
  ["--primary-foreground", "--primary", "Primary button", 4.5],
  ["--primary", "--background", "Links and primary text", 4.5],
  ["--secondary-foreground", "--secondary", "Secondary button", 4.5],
  ["--success", "--success-muted", "Success badge", 4.5],
  ["--warning", "--warning-muted", "Warning badge", 4.5],
  ["--critical", "--critical-muted", "Critical badge", 4.5],
  ["--input", "--background", "Input and checkbox border", 3],
  ["--input", "--muted", "Input border on muted", 3],
  ["--focus", "--background", "Keyboard focus outline", 3],
  ["--ring", "--background", "Selected state ring", 3],
  ["--chart-1", "--card", "Chart series 1", 3],
  ["--chart-2", "--card", "Chart series 2", 3],
  ["--chart-4", "--card", "Chart series 4", 3],
];

/* ---------- colour maths ---------- */

let probe: HTMLSpanElement | null = null;
function resolve(token: string): [number, number, number] | null {
  if (typeof document === "undefined") return null;
  probe ??= Object.assign(document.createElement("span"), { style: "position:absolute;visibility:hidden" });
  if (!probe.isConnected) document.body.appendChild(probe);
  probe.style.backgroundColor = `var(${token})`;
  const c = getComputedStyle(probe).backgroundColor;
  const nums = c.match(/[\d.]+/g)?.map(Number);
  if (!nums || nums.length < 3) return null;
  // "color(srgb 0.2 0.1 0.5)" from color-mix vs "rgb(51, 25, 128)"
  return c.startsWith("color(") ? [nums[0] * 255, nums[1] * 255, nums[2] * 255] : [nums[0], nums[1], nums[2]];
}

function toHex(rgb: [number, number, number] | null) {
  if (!rgb) return "";
  return `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function luminance([r, g, b]: [number, number, number]) {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a: string, b: string) {
  const x = resolve(a);
  const y = resolve(b);
  if (!x || !y) return null;
  const [l1, l2] = [luminance(x), luminance(y)].sort((m, n) => n - m);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* ---------- component ---------- */

export function TokenEditor() {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [radius, setRadius] = useState(8);

  const refresh = useCallback(() => {
    const all = [...primitives.map((p) => p.name), ...semanticGroups.flatMap((g) => g.tokens)];
    setValues(Object.fromEntries(all.map((t) => [t, toHex(resolve(t))])));
    const r = getComputedStyle(document.documentElement).getPropertyValue("--radius").trim();
    setRadius(r.endsWith("rem") ? parseFloat(r) * 16 : parseFloat(r) || 8);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from localStorage + computed styles after mount
    setOverrides(readOverrides());
    const id = requestAnimationFrame(refresh);
    return () => cancelAnimationFrame(id);
  }, [refresh]);

  function set(token: string, value: string) {
    const next = { ...overrides, [token]: value };
    setOverrides(next);
    writeOverrides(next);
    requestAnimationFrame(refresh);
  }

  function reset(token?: string) {
    const next = token ? Object.fromEntries(Object.entries(overrides).filter(([k]) => k !== token)) : {};
    setOverrides(next);
    writeOverrides(next);
    requestAnimationFrame(refresh);
  }

  const css = `:root {\n${Object.entries(overrides)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join("\n")}\n}`;

  return (
    <div className="flex flex-col gap-6">
      <Card className={cn(Object.keys(overrides).length && "ring-2 ring-ring")}>
        <CardHeader>
          <CardTitle>Try a change</CardTitle>
          <CardDescription className="max-w-[70ch]">
            Change a colour or the radius here and every screen in the app updates straight away. Changes are saved in this browser only.
            When you’re happy, copy the CSS into <code className="rounded bg-muted px-1 py-0.5 text-xs">src/app/globals.css</code> so it
            becomes the real token.
          </CardDescription>
          <CardAction className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!Object.keys(overrides).length}
              onClick={() => {
                navigator.clipboard?.writeText(css);
                toast.success("CSS copied", { description: "Paste it into the :root block of globals.css" });
              }}
            >
              <Copy data-icon="inline-start" /> Copy CSS
            </Button>
            <Button variant="ghost" size="sm" disabled={!Object.keys(overrides).length} onClick={() => reset()}>
              <RotateCcw data-icon="inline-start" /> Reset all
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex max-w-md items-center gap-4">
            <span className="w-28 shrink-0 text-sm">Corner radius</span>
            <Slider
              min={0}
              max={20}
              step={1}
              value={[radius]}
              onValueChange={([v]) => {
                setRadius(v);
                set("--radius", `${v / 16}rem`);
              }}
              aria-label="Corner radius"
            />
            <span className="tnum w-12 text-right text-sm text-muted-foreground">{radius}px</span>
          </div>
          {Object.keys(overrides).length > 0 && (
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              <code>{css}</code>
            </pre>
          )}
        </CardContent>
      </Card>

      <section>
        <h3 className="mb-1 text-base font-medium">Brand primitives</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Layer 1. Taken from the brand guidelines. Semantic tokens point at these, so changing one changes everything that uses it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {primitives.map((p) => (
            <Swatch key={p.name} token={p.name} label={p.label} note={p.note} value={values[p.name]} edited={p.name in overrides} onChange={set} onReset={reset} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-base font-medium">Semantic tokens</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Layer 2. The shadcn/ui contract. Components only ever read these.
        </p>
        <div className="flex flex-col gap-6">
          {semanticGroups.map((g) => (
            <div key={g.title}>
              <p className="mb-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{g.title}</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {g.tokens.map((t) => (
                  <Swatch key={t} token={t} value={values[t]} edited={t in overrides} onChange={set} onReset={reset} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="contrast" className="scroll-mt-20">
        <h3 className="mb-1 text-base font-medium">Contrast: WCAG 2.2 AA</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Worked out live from the current tokens, so a change in the editor above is checked straight away. Text needs 4.5:1
          (1.4.3). Control borders, focus indicators and chart marks need 3:1 (1.4.11). <code>--border</code> is for decorative
          dividers only and is exempt.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {contrastPairs.map(([fg, bg, label, min]) => {
            const r = values[fg] ? contrast(fg, bg) : null;
            const pass = r !== null && r >= min;
            return (
              <div key={label} className="flex items-center gap-3 rounded-lg p-3 shadow-xs">
                {min === 4.5 ? (
                  <span className="grid size-10 shrink-0 place-items-center rounded-md text-sm font-medium" style={{ background: `var(${bg})`, color: `var(${fg})` }}>
                    Aa
                  </span>
                ) : (
                  <span className="grid size-10 shrink-0 place-items-center rounded-md" style={{ background: `var(${bg})` }}>
                    <span className="size-6 rounded-sm border-2" style={{ borderColor: `var(${fg})` }} />
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{label}</span>
                  <span className="tnum text-xs text-muted-foreground">
                    {r ? `${r.toFixed(2)}:1` : "—"} · needs {min}:1
                  </span>
                </span>
                {r !== null && <Badge variant={pass ? "success" : "critical"}>{pass ? "Pass" : "Fails"}</Badge>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Swatch({
  token,
  label,
  note,
  value,
  edited,
  onChange,
  onReset,
  compact,
}: {
  token: string;
  label?: string;
  note?: string;
  value?: string;
  edited: boolean;
  onChange: (t: string, v: string) => void;
  onReset: (t: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("group flex items-center gap-3 rounded-lg bg-card p-2.5 shadow-xs", edited && "border-ring")}>
      <label className="relative block shrink-0 cursor-pointer" title={`Edit ${token}`}>
        <span className={cn("block rounded-md ring-1 ring-foreground/10", compact ? "size-9" : "size-12")} style={{ background: `var(${token})` }} />
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(token, e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={`Edit ${token}`}
        />
      </label>
      <span className="min-w-0 flex-1">
        {label && <span className="block text-sm font-medium">{label}</span>}
        <code className={cn("block truncate text-xs", label ? "text-muted-foreground" : "text-foreground")}>{token}</code>
        <span className="tnum block text-xs text-muted-foreground uppercase">{value}</span>
        {note && !compact && <span className="block truncate text-xs text-muted-foreground">{note}</span>}
      </span>
      {edited && (
        <Button variant="ghost" size="icon-xs" aria-label={`Reset ${token}`} onClick={() => onReset(token)}>
          <RotateCcw />
        </Button>
      )}
      {!edited && <Check className="size-3.5 text-transparent" aria-hidden />}
    </div>
  );
}
