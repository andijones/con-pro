"use client";
// Throwaway: /proto/risk-map harness. Variant 1 is the live reader: the navigator rail went live on 7 October 2026.
import { Picker } from "../home/picker";
import { FullReader } from "./reader";

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [
    () => <div className="mx-auto max-w-4xl py-6">{current}</div>,
    () => <FullReader map="minimap" />,
    () => <FullReader map="index" />,
    () => <FullReader map="navigator" />,
    () => <FullReader map="rail" />,
  ];
  return (
    <Picker
      names={["Live (rail)", "Minimap", "Index", "Navigator", "Navigator rail"]}
      render={(i) => {
        const V = variants[i];
        return <V />;
      }}
    />
  );
}
