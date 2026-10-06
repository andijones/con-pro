"use client";
// Throwaway: /proto/chat harness. Variant 1 is the live chat page (Focus, promoted 6 October 2026).
import { Picker } from "../home/picker";
import { Aurora, Midnight } from "./variants";

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [() => <>{current}</>, Aurora, Midnight];
  return (
    <Picker
      names={["Focus (live)", "Aurora stage", "Midnight"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
