"use client";
// Throwaway: /proto/chat harness. Variant 1 is the live chat page (Focus, promoted 6 October 2026).
// Round 2 (7 October): Quiet list and Chips, two calmer takes on Focus.
import { Picker } from "../home/picker";
import { Aurora, Midnight } from "./variants";
import { Chips, QuietList } from "./calm";

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [() => <>{current}</>, Aurora, Midnight, QuietList, Chips];
  return (
    <Picker
      names={["Focus (live)", "Aurora stage", "Midnight", "Quiet list", "Chips"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
