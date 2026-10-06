"use client";
// Throwaway: /proto/ask-entry. Three homes for Ask Contravo that are easy to find and easy to ignore.
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** The live drawer listens for ⌘J; the variants use the same door */
export const toggleDrawer = () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "j", metaKey: true, bubbles: true }));

/** Follows the real drawer: it's open when #ask-drawer isn't inert */
export function useDrawerOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const el = document.getElementById("ask-drawer");
    if (!el) return;
    const read = () => setOpen(!el.hasAttribute("inert"));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ["inert"] });
    return () => mo.disconnect();
  }, []);
  return open;
}

/** Hide the live edge tab while a variant is showing (it still closes the drawer from inside: X, Escape, the scrim) */
export const hideEdgeTab = `div.ai-glow:has(> button[aria-controls="ask-drawer"]:not([data-proto])) { display: none; }`;

/* ---------- 1. Launcher: a quiet pill in the panel's bottom-right corner, where help usually lives ---------- */

/** Fixed UI must render outside <main>: it's a CSS container, which makes position:fixed relative to it */
const noop = () => () => {};
export function ToBody({ children }: { children: React.ReactNode }) {
  // true on the client, false during SSR, with no frame to wait for (hidden tabs throttle requestAnimationFrame)
  const client = useSyncExternalStore(noop, () => true, () => false);
  return client ? createPortal(children, document.body) : null;
}

export function Launcher({ className }: { className?: string }) {
  const open = useDrawerOpen();
  return (
    <ToBody>
      <style>{hideEdgeTab}</style>
      <div
        className={cn(
          "ai-glow fixed right-6 bottom-6 z-(--z-header) rounded-full [--ai-glow-blur:3px] md:right-8 md:bottom-8",
          className,
          "transition-[opacity,translate] duration-(--duration-base) ease-(--ease-out)",
          open && "pointer-events-none translate-y-2 opacity-0",
        )}
      >
        <button
          type="button"
          onClick={toggleDrawer}
          data-proto
          aria-controls="ask-drawer"
          aria-expanded={open}
          aria-keyshortcuts="Meta+J Control+J"
          className={cn(
            "flex h-11 items-center gap-2 rounded-full bg-background pr-4.5 pl-3.5 text-sm font-medium text-foreground",
            "shadow-(--shadow-raised) transition-[box-shadow,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-(--press-scale)",
            "fine-hover:hover:shadow-(--shadow-md)",
          )}
        >
          <Sparkles className="size-4 text-primary" aria-hidden />
          Ask Contravo
        </button>
      </div>
    </ToBody>
  );
}

/* ---------- 2. Right rail: a slim rail in the app frame, mirroring the sidebar, so the panel sits between the two ---------- */

export function Rail() {
  const open = useDrawerOpen();
  return (
    <ToBody>
      <style>{`
        ${hideEdgeTab}
        @media (min-width: 768px) {
          [data-slot="sidebar-inset"] { margin-right: 3.5rem !important; }
        }
      `}</style>
      <nav aria-label="Assistant" className="fixed top-2 right-0 bottom-2 z-(--z-header) hidden w-14 flex-col items-center pt-3 md:flex">
        <div className="ai-glow rounded-xl [--ai-glow-blur:3px]">
          <button
            type="button"
            onClick={toggleDrawer}
            data-proto
          aria-controls="ask-drawer"
            aria-expanded={open}
            aria-keyshortcuts="Meta+J Control+J"
            aria-label="Ask Contravo"
            title="Ask Contravo"
            className={cn(
              "grid size-10 place-items-center rounded-xl bg-background text-primary shadow-(--shadow-button)",
              "transition-[box-shadow,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-(--press-scale) fine-hover:hover:shadow-(--shadow-button-hover)",
            )}
          >
            <Sparkles className="size-4.5" aria-hidden />
          </button>
        </div>
        <span aria-hidden className="mt-1.5 text-[11px] font-medium text-muted-foreground">
          Ask
        </span>
      </nav>
      {/* Phones have no rail: the launcher stands in */}
      <Launcher className="md:hidden" />
    </ToBody>
  );
}

/* ---------- 3. Page bar: Ask sits with the page's own actions, at the top, where you already look to act ---------- */

export function PageBar() {
  const open = useDrawerOpen();
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const find = () => document.querySelector<HTMLElement>("header.page-bar > div:last-child");
    // Polled, not read in the effect body: the page bar may render after this mounts
    const t = setInterval(() => {
      const e = find();
      if (e) {
        setSlot(e);
        clearInterval(t);
      }
    }, 50);
    return () => clearInterval(t);
  }, []);
  return (
    <>
      <style>{hideEdgeTab}</style>
      {slot &&
        createPortal(
          <div className="ai-glow order-first rounded-lg [--ai-glow-blur:2px]">
            <button
              type="button"
              onClick={toggleDrawer}
              data-proto
          aria-controls="ask-drawer"
              aria-expanded={open}
              aria-keyshortcuts="Meta+J Control+J"
              className={cn(
                "flex h-(--control-height) items-center gap-2 rounded-lg bg-background px-3 text-sm font-medium text-foreground",
                "shadow-(--shadow-button) transition-[box-shadow,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-(--press-scale) fine-hover:hover:shadow-(--shadow-button-hover)",
              )}
            >
              <Sparkles className="size-4 text-primary" aria-hidden />
              Ask Contravo
            </button>
          </div>,
          slot,
        )}
    </>
  );
}
