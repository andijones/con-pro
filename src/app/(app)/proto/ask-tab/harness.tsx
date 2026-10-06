"use client";
// Throwaway: /proto/ask-tab harness. Variant 1 is the live edge tab; the others hide it and open the real drawer.
import { Picker } from "../home/picker";
import { Contextual, Peek, Seam } from "./variants";

export function Harness({ current }: { current: React.ReactNode }) {
  const tabs = [null, Seam, Peek, Contextual];
  return (
    <Picker
      names={["Edge tab (live)", "Seam", "Peek", "Contextual"]}
      render={(i) => {
        const T = tabs[i];
        return (
          <>
            {current}
            {T && <T />}
          </>
        );
      }}
    />
  );
}
