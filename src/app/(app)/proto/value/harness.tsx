"use client";
// Throwaway: /proto/value harness. Variant 1 is the Value concept from /proto/home, unchanged.
import { Picker } from "../home/picker";
import { Value } from "../home/value";
import { Checklist, Focus, Summary } from "./calm";

const variants = [Value, Focus, Summary, Checklist];

export function Harness() {
  return (
    <Picker
      names={["Value", "Focus", "Summary", "Checklist"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
