// Throwaway: /proto/audit. The audit trail, easier to take in. Nothing in production imports this folder.
import { Suspense } from "react";
import { Harness } from "./harness";

export const metadata = { title: "Audit concepts" };

export default function ProtoAudit() {
  return (
    <Suspense>
      <Harness />
    </Suspense>
  );
}
