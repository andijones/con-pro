"use client";
// Throwaway: /proto/audit harness. Variant 1 is a copy of the live audit feed.
import { Picker } from "../home/picker";
import { Current } from "./parts";
import { Column, Digest, Index } from "./variants";

const variants = [Current, Column, Index, Digest];

export function Harness() {
  return (
    <Picker
      names={["Current", "Column", "Index", "Digest"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
