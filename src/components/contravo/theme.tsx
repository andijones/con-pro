"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------- Live token overrides (set from /design-system) ---------- */

import { OVERRIDES_KEY } from "./token-keys";

export { OVERRIDES_KEY };

export function readOverrides(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function writeOverrides(o: Record<string, string>) {
  try {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(o));
  } catch {
    /* storage unavailable: overrides last for this page view only */
  }
  applyOverrides(o);
}

let applied: string[] = [];
export function applyOverrides(o: Record<string, string>) {
  const root = document.documentElement;
  applied.forEach((k) => root.style.removeProperty(k));
  Object.entries(o).forEach(([k, v]) => root.style.setProperty(k, v));
  applied = Object.keys(o);
}

/** Re-applies any token experiments from the design-system page on every screen. */
export function TokenOverrides() {
  useEffect(() => {
    applyOverrides(readOverrides());
    const onStorage = (e: StorageEvent) => e.key === OVERRIDES_KEY && applyOverrides(readOverrides());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  return null;
}
