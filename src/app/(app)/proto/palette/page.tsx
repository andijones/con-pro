// Throwaway: /proto/palette. The real Home and sidebar under different neutral palettes. Nothing in production imports this folder.
import { Suspense } from "react";
import Home from "../../page";
import { Harness } from "./harness";

export const metadata = { title: "Palette concepts" };

export default function ProtoPalette() {
  return (
    <Suspense>
      <Harness current={<Home />} />
    </Suspense>
  );
}
