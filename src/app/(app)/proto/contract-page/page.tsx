// Throwaway: /proto/contract-page. Two-column contract page concepts, behind the picker. Nothing in production imports this folder.
import { Suspense } from "react";
import ContractPage from "../../contracts/[id]/page";
import { Harness } from "./harness";

export const metadata = { title: "Contract page concepts" };

export default async function ProtoContractPage() {
  const current = await ContractPage({ params: Promise.resolve({ id: "mes-imaging" }), searchParams: Promise.resolve({}) } as never);
  return (
    <Suspense>
      <Harness current={current} />
    </Suspense>
  );
}
