"use client";
// Throwaway: /proto/palette harness. Slate surfaces is live (globals.css); each other variant is the live Home plus a token override, mounted as a <style> while
// it's selected; tokens are global, so the sidebar and page panel change too. Purple (primary, secondary buttons,
// active nav, focus edge, AI gradients) is left alone in every variant.
import { Picker } from "../home/picker";
import { frost, slateInk } from "./palettes";

export function Harness({ current }: { current: React.ReactNode }) {
  const variants = [frost, null, slateInk];
  return (
    <Picker
      names={["Frost (before)", "Slate surfaces (live)", "Slate all through"]}
      render={(i) => (
        <>
          {variants[i] && <style>{variants[i]}</style>}
          {current}
        </>
      )}
    />
  );
}
