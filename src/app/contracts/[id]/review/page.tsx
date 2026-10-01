import { notFound } from "next/navigation";
import { extractionFor } from "@/lib/extraction";
import { ReviewWorkspace } from "@/components/contravo/review-workspace";

export const metadata = { title: "Review what the AI read" };

export default async function ReviewPage(props: PageProps<"/contracts/[id]/review">) {
  const { id } = await props.params;
  const x = extractionFor(id);
  if (!x) notFound();
  return <ReviewWorkspace contract={x.contract} fields={x.fields} pages={x.pages} />;
}
