import { notFound } from "next/navigation";
import { extractionFor } from "@/lib/extraction";
import { DetailsForm } from "@/components/contravo/details-form";

export const metadata = { title: "Add what the AI couldn’t" };

export default async function DetailsPage(props: PageProps<"/contracts/[id]/details">) {
  const { id } = await props.params;
  const x = extractionFor(id);
  if (!x) notFound();
  const cp = x.fields.find((f) => f.key === "counterparty")?.value;
  return <DetailsForm contract={x.contract} pages={x.pages} counterpartyRead={cp} />;
}
