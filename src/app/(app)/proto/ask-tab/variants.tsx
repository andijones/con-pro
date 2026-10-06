"use client";
// Throwaway: /proto/ask-tab. Three ways to make the edge tab obvious without Violet: a seam, a peeking drawer, relevance.
import { ChevronRight, Sparkles } from "lucide-react";
import { suggestions } from "@/lib/answers";
import { cn } from "@/lib/utils";
import { hideEdgeTab, ToBody, toggleDrawer, useDrawerOpen } from "../ask-entry/variants";

/** The drawer's width, so a tab can ride its leading edge when it opens (same as the live drawer) */
const DRAWER_W = "min(420px, calc(100vw - 2.75rem))";

/** The live tab's shape: white, 40px wide, vertical label. Each concept dresses it differently. */
function Tab({ open, label = "Ask Contravo", ariaLabel, className, children }: { open: boolean; label?: string; ariaLabel?: string; className?: string; children?: React.ReactNode }) {
  return (
    <button
      type="button"
      data-proto
      onClick={toggleDrawer}
      aria-controls="ask-drawer"
      aria-expanded={open}
      aria-keyshortcuts="Meta+J Control+J"
      aria-label={ariaLabel ?? (open ? "Close Ask Contravo" : "Open Ask Contravo")}
      className={cn(
        "relative flex w-10 flex-col items-center gap-2.5 rounded-l-xl bg-background py-4 text-foreground",
        "shadow-(--shadow-button) transition-[box-shadow,background-color] duration-(--duration-fast) ease-(--ease-out) fine-hover:hover:shadow-(--shadow-button-hover)",
        className,
      )}
    >
      {children}
      {open ? <ChevronRight className="size-4 text-muted-foreground" aria-hidden /> : <Sparkles className="size-4 text-muted-foreground" aria-hidden />}
      <span className="rotate-180 text-[13px] font-medium tracking-[0.01em] [writing-mode:vertical-rl]" aria-hidden>
        {label}
      </span>
    </button>
  );
}

/** Rides the drawer's leading edge: at the window edge when closed, slides in with the drawer when open */
function Rider({ open, className, children }: { open: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn("fixed top-1/2 right-0 z-(--z-overlay) transition-transform ease-(--ease-out)", open ? "duration-250" : "duration-180", className)}
      style={{ transform: `translateY(-50%) translateX(${open ? `calc(-1 * ${DRAWER_W})` : "0px"})` }}
    >
      {children}
    </div>
  );
}

/* ---------- 1. Seam: a full-height AI-colour line down the window edge, the tab hanging on it ---------- */

export function Seam() {
  const open = useDrawerOpen();
  return (
    <ToBody>
      <style>{`
        ${hideEdgeTab}
        .proto-seam {
          background: linear-gradient(to bottom in oklab, transparent, var(--brand-iris) 18%, var(--halo-mint) 50%, var(--brand-lilac-deep) 82%, transparent);
        }
      `}</style>
      {/* Decorative: the line says "something lives on this edge"; the tab is the control */}
      <div
        aria-hidden
        onClick={toggleDrawer}
        className={cn(
          "proto-seam fixed top-2 right-[3px] bottom-2 z-(--z-header) w-0.5 cursor-pointer rounded-full opacity-80 transition-opacity duration-(--duration-base)",
          open && "opacity-0",
        )}
      />
      <Rider open={open}>
        <Tab open={open} className="shadow-[0_0_0_1px_color-mix(in_oklab,var(--brand-iris)_35%,transparent),0_4px_14px_-4px_color-mix(in_oklab,var(--brand-iris)_35%,transparent)]" />
      </Rider>
    </ToBody>
  );
}

/* ---------- 2. Peek: the drawer's own edge stays in view, full height; the tab is its handle ---------- */

export function Peek() {
  const open = useDrawerOpen();
  return (
    <ToBody>
      <style>{`
        ${hideEdgeTab}
        @media (min-width: 768px) {
          [data-slot="sidebar-inset"] { margin-right: 1.25rem !important; }
        }
        .proto-peek { transition: translate var(--duration-base) var(--ease-out), opacity var(--duration-base) var(--ease-out); }
        .proto-peek-group:hover .proto-peek, .proto-peek-group:focus-within .proto-peek { translate: -4px 0; }
        .proto-peek::before {
          content: ""; position: absolute; inset-block: 1rem; left: 0; width: 2px; border-radius: 9999px;
          background: linear-gradient(to bottom in oklab, transparent, var(--brand-iris), var(--halo-mint), transparent);
          opacity: 0.55;
        }
        @media (prefers-reduced-motion: reduce) { .proto-peek { transition: none; } }
      `}</style>
      <div className="proto-peek-group">
        {/* The sliver: the drawer's edge, white like the drawer, the full height of the window */}
        <div
          aria-hidden
          onClick={toggleDrawer}
          className={cn("proto-peek fixed top-2 -right-2 bottom-2 z-(--z-header) w-6 cursor-pointer rounded-l-xl bg-background shadow-card", open && "pointer-events-none opacity-0")}
        />
        <Rider open={open} className={open ? "" : "-translate-x-2.5"}>
          <div className={cn("proto-peek relative", !open && "-mr-px")}>
            <Tab open={open} />
          </div>
        </Rider>
      </div>
    </ToBody>
  );
}

/* ---------- 3. Contextual: the tab says what it can do here, and nudges once when a page has questions ---------- */

export function Contextual() {
  const open = useDrawerOpen();
  const n = Math.min(3, suggestions.length);
  return (
    <ToBody>
      <style>{`
        ${hideEdgeTab}
        @keyframes proto-nudge { 0%, 100% { translate: 0 0; } 40% { translate: -6px 0; } }
        .proto-nudge { animation: proto-nudge 700ms var(--ease-out) 1.2s 1; }
        @media (prefers-reduced-motion: reduce) { .proto-nudge { animation: none; } }
        .proto-teaser { opacity: 0; translate: 6px -50%; transition: opacity var(--duration-fast) var(--ease-out), translate var(--duration-fast) var(--ease-out); }
        .proto-ctx:hover .proto-teaser, .proto-ctx:focus-within .proto-teaser { opacity: 1; translate: 0 -50%; }
        @media (prefers-reduced-motion: reduce) { .proto-teaser { transition: none; } }
      `}</style>
      <Rider open={open}>
        <div className="proto-ctx proto-nudge relative">
          <Tab open={open} label="Ask about this page" ariaLabel={open ? "Close Ask Contravo" : `Ask Contravo about this page: ${n} suggested questions`}>
            {!open && (
              <span aria-hidden className="tnum grid size-5 place-items-center rounded-full bg-brand-mint text-[11px] font-medium text-foreground">
                {n}
              </span>
            )}
          </Tab>
          {/* Hover teaser: a taste of what's there. Extra, never the only way in (the tab itself opens everything). */}
          {!open && (
            <div aria-hidden className="proto-teaser pointer-events-none absolute top-1/2 right-[calc(100%+0.5rem)] w-60 rounded-lg bg-popover p-3 text-sm shadow-menu">
              <p className="text-xs text-muted-foreground">Try asking</p>
              <p className="mt-1 text-pretty">{suggestions[2]}</p>
            </div>
          )}
        </div>
      </Rider>
    </ToBody>
  );
}
