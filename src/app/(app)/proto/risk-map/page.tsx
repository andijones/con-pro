// Throwaway: /proto/risk-map. The full contract with three ways to see and jump between its risks.
// Nothing in production imports this folder.
import { Suspense } from "react";
import { getContract } from "@/lib/data";
import { documentFor } from "@/lib/contract-documents";
import { ContractReader } from "@/components/contravo/contract-reader";
import { Harness } from "./harness";

export const metadata = { title: "Risk map concepts" };

export default function ProtoRiskMap() {
  const c = getContract("mes-imaging")!;
  return (
    <Suspense>
      <Harness current={<ContractReader contractId={c.id} clauses={c.clauses} document={documentFor(c.id)} title={c.title} pages={c.pages} />} />
    </Suspense>
  );
}
