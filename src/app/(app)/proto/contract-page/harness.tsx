"use client";
// Throwaway: /proto/contract-page harness. Variant 1 is the live contract page, rendered on the server and passed in.
import { Picker } from "../home/picker";
import { Merged, Split, TabsLayout } from "./variants";

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [() => <>{current}</>, Split, TabsLayout, Merged];
  return (
    <Picker
      names={["Current", "Split", "Tabs", "Merged"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
