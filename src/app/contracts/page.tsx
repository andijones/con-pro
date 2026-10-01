import { workspace } from "@/lib/data";
import { decisionsFor, estateTotals, nextDeadline } from "@/lib/derive";
import { gbp } from "@/lib/dates";
import { ContractRegister } from "@/components/contravo/contract-register";
import { PageHeader } from "@/components/contravo/primitives";

export const metadata = { title: "Contracts" };

export default async function ContractsPage(props: PageProps<"/contracts">) {
  const sp = await props.searchParams;
  const rows = workspace.map((c) => ({ ...c, next: nextDeadline(c), open: decisionsFor(c.id).length }));
  const t = estateTotals();
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Contracts">
        About <span className="tnum text-foreground">{gbp(t.gbpAnnual, { compact: true })}</span> a year across {t.live} live contracts.
        Sorted by the next date that matters. You can sort by any column.
      </PageHeader>
      <div className="mt-6">
        <ContractRegister
          rows={rows}
          initialStatus={typeof sp.status === "string" ? sp.status : undefined}
          initialView={typeof sp.view === "string" ? sp.view : undefined}
        />
      </div>
    </div>
  );
}
