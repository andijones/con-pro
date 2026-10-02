// Throwaway: /proto/home. Home concepts behind the picker. Nothing in production imports this folder.
import { Suspense } from "react";
import { Harness } from "./harness";

export const metadata = { title: "Home concepts" };

export default function ProtoHome() {
  return (
    <Suspense>
      <Harness />
    </Suspense>
  );
}
