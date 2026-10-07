"use client";
// Throwaway: /proto/timeline harness. Variant 1 is the live timeline (Zoom, promoted 7 October 2026).
import { Picker } from "../home/picker";
import { Cliff } from "./cliff";
import { Horizon } from "./horizon";

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [() => <>{current}</>, Horizon, Cliff];
  return (
    <Picker
      names={["Zoom (live)", "Horizon", "Cliff"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
