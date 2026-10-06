"use client";
// Throwaway: /proto/contracts harness. Variant 1 is the page before Tabs; the last is the live page (Tabs).
import { Picker } from "../home/picker";
import { ClearSections, Worklist } from "./variants";
import { Original } from "./original";
import { estateTotals } from "@/lib/derive";

const t = estateTotals();
const Accordions = () => <Original live={t.live} annual={t.gbpAnnual} />;

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [Accordions, ClearSections, Worklist, () => <>{current}</>];
  return (
    <Picker
      names={["Accordions", "Clear sections", "Worklist", "Tabs (live)"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
