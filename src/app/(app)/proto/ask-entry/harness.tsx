"use client";
// Throwaway: /proto/ask-entry harness. Variant 1 is the live edge tab. The others hide it (a <style> mounted only
// while they're selected) and open the real drawer through its ⌘J shortcut, so the drawer itself is untouched.
import { Picker } from "../home/picker";
import { Launcher, PageBar, Rail } from "./variants";

export function Harness({ current }: { current: React.ReactNode }) {
  const triggers = [null, Launcher, Rail, PageBar];
  return (
    <Picker
      names={["Edge tab (live)", "Launcher", "Right rail", "Page bar"]}
      render={(i) => {
        const T = triggers[i];
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
