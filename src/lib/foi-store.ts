"use client";

/**
 * What an officer has done to a request in this session: clarification asked, sent for sign-off, approved, sent.
 * The concept has no back end, so changes live in sessionStorage and every FOI view reads them, which keeps the list
 * and the case page in step. The server renders the seed data; the browser applies these straight after.
 */
import { useSyncExternalStore } from "react";
import type { FoiRequest } from "./data";

export type FoiPatch = Partial<Pick<FoiRequest, "status" | "received" | "reviewer" | "clarifyAsked" | "approvedBy" | "sentOn">>;
type Store = Record<string, FoiPatch>;

const KEY = "contravo:foi";
const EMPTY: Store = {};
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Store } = { raw: null, value: EMPTY };

function read(): Store {
  let raw: string | null = null;
  try {
    raw = sessionStorage.getItem(KEY);
  } catch {
    return EMPTY; // storage blocked: behave as if nothing has changed
  }
  if (raw !== cache.raw) {
    try {
      cache = { raw, value: raw ? (JSON.parse(raw) as Store) : EMPTY };
    } catch {
      cache = { raw, value: EMPTY };
    }
  }
  return cache.value;
}

export function updateFoi(id: string, patch: FoiPatch) {
  const next = { ...read(), [id]: { ...read()[id], ...patch } };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: the change lasts until the page reloads */
    cache = { raw: JSON.stringify(next), value: next };
  }
  listeners.forEach((l) => l());
}

/** Undo: put a request's changes back exactly as they were */
export function restoreFoi(id: string, before: FoiPatch | undefined) {
  const next = { ...read() };
  if (before) next[id] = before;
  else delete next[id];
  try {
    sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    cache = { raw: JSON.stringify(next), value: next };
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Every request's changes this session (empty on the server) */
export function useFoiPatches() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** A request with this session's changes applied */
export function withPatch(f: FoiRequest, patches: Store): FoiRequest {
  return patches[f.id] ? { ...f, ...patches[f.id] } : f;
}
