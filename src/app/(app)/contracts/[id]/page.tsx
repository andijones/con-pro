import Link from "next/link";
import { notFound } from "next/navigation";
import { FileSearch, ListChecks, MessageSquare, Pencil } from "lucide-react";
import { getContract, workspace } from "@/lib/data";
import { ContractPanel } from "@/components/contravo/contract-panel";
import { documentFor } from "@/lib/contract-documents";
import { ContractReader } from "@/components/contravo/contract-reader";
import { BackLink, ExtractionBadge, PageHeader, StatusBadge } from "@/components/contravo/primitives";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return workspace.map((c) => ({ id: c.id }));
}

export async function generateMetadata(props: PageProps<"/contracts/[id]">) {
  const { id } = await props.params;
  return { title: getContract(id)?.title ?? "Contract" };
}

export default async function ContractPage(props: PageProps<"/contracts/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;
  const c = getContract(id);
  if (!c) notFound();

  const clause = typeof sp.clause === "string" ? sp.clause : undefined;
  const live = c.extraction === "Reviewed" && ["Active", "Under review", "Legal review", "Draft"].includes(c.status);

  return (
    <div>
      <PageHeader
        title={c.title}
        leading={<BackLink href="/contracts" label="contracts" />}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/contracts/${c.id}/details`}>
                <Pencil data-icon="inline-start" /> Edit details
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/chat?q=${encodeURIComponent(`Can we end the ${c.title.toLowerCase()} contract early?`)}`}>
                <MessageSquare data-icon="inline-start" /> Ask about this contract
              </Link>
            </Button>
          </>
        }
      />
      {/* One status line: supplier included, and the extraction review as a quiet link */}
      <div className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
        <StatusBadge status={c.status} />
        <ExtractionBadge state={c.extraction} />
        <span className="text-foreground">{c.supplier ?? <span className="text-warning">No counterparty recorded</span>}</span>
        <span aria-hidden>·</span>
        <span>{c.category}</span>
        {c.businessUnit && (
          <>
            <span aria-hidden>·</span>
            <span>{c.businessUnit}</span>
          </>
        )}
        <span aria-hidden>·</span>
        <span>{c.route}</span>
        <Link href={`/contracts/${c.id}/review`} className="hit-area-y ml-auto inline-flex items-center gap-1 underline-offset-4 hover:text-foreground hover:underline">
          <ListChecks className="size-3.5" aria-hidden /> Review extraction
        </Link>
      </div>

      {c.extraction === "Ready to review" && (
        <Alert className="mt-6">
          <FileSearch />
          <AlertTitle>The AI has read this contract. Check what it found before it goes live.</AlertTitle>
          <AlertDescription>
            <Link href={`/contracts/${c.id}/review`} className="font-medium text-primary underline underline-offset-4">
              Review what the AI read
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Two columns from xl: what needs you on the left, the contract on the right */}
      <div className="mt-8 grid gap-10 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="scroll-subtle min-w-0 xl:sticky xl:top-(--page-bar-offset) xl:max-h-[calc(100dvh-var(--page-bar-offset)-1.5rem)] xl:self-start xl:overflow-y-auto xl:rounded-(--tray-radius)">
          <ContractPanel contractId={c.id} live={live} />
        </div>
        <section className="min-w-0">
          <ContractReader key={clause ?? "default"} contractId={c.id} clauses={c.clauses} document={documentFor(c.id)} initial={clause} title={c.title} pages={c.pages} />
        </section>
      </div>
    </div>
  );
}
