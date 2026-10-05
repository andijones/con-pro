// Throwaway: /proto/value. Calmer takes on the Value home, behind the picker. Nothing in production imports this folder.
import { Suspense } from "react";
import { Harness } from "./harness";

export const metadata = { title: "Value concepts" };

export default function ProtoValue() {
  return (
    <Suspense>
      <Harness />
    </Suspense>
  );
}
