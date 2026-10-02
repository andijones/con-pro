import { estateTotals } from "@/lib/derive";
import { ContractGroups } from "@/components/contravo/contract-groups";

export const metadata = { title: "Contracts" };

export default function ContractsPage() {
  const t = estateTotals();
  return (
    <div className="mx-auto max-w-[1080px]">
      <ContractGroups live={t.live} annual={t.gbpAnnual} />
    </div>
  );
}
