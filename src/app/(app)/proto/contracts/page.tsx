// Throwaway: /proto/contracts. Contracts list concepts behind the picker. Nothing in production imports this folder.
import { Suspense } from "react";
import ContractsPage from "../../contracts/page";
import { Harness } from "./harness";

export const metadata = { title: "Contracts concepts" };

export default function ProtoContracts() {
  return (
    <Suspense>
      <Harness current={<ContractsPage />} />
    </Suspense>
  );
}
