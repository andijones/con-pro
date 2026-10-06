// Throwaway: /proto/ask-tab. Making the Ask Contravo edge tab easier to find, on the real Contracts page.
// Nothing in production imports this folder.
import { Suspense } from "react";
import ContractsPage from "../../contracts/page";
import { Harness } from "./harness";

export const metadata = { title: "Ask tab concepts" };

export default function ProtoAskTab() {
  return (
    <Suspense>
      <Harness current={<ContractsPage />} />
    </Suspense>
  );
}
