// Throwaway: /proto/ask-entry. Where Ask Contravo lives, on the real Contracts page with the real drawer.
// Nothing in production imports this folder.
import { Suspense } from "react";
import ContractsPage from "../../contracts/page";
import { Harness } from "./harness";

export const metadata = { title: "Ask entry concepts" };

export default function ProtoAskEntry() {
  return (
    <Suspense>
      <Harness current={<ContractsPage />} />
    </Suspense>
  );
}
