import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { foiRequests, getFoi, type FoiRequest } from "@/lib/data";
import { foiCases } from "@/lib/foi-cases";
import { TODAY } from "@/lib/dates";
import { foiDue, foiElapsed } from "@/lib/derive";
import { FoiWorkspace } from "@/components/contravo/foi-workspace";
import { Person } from "@/components/contravo/primitives";
import { Button } from "@/components/ui/button";

export function generateStaticParams() {
  return foiRequests.map((f) => ({ id: f.id }));
}

export async function generateMetadata(props: PageProps<"/foi/[id]">) {
  const { id } = await props.params;
  return { title: id === "new" ? "New FOI request" : (getFoi(id)?.ref ?? "FOI request") };
}

/** Pick the closest worked example for a pasted request (concept only: no live search). */
function templateFor(text: string) {
  const t = text.toLowerCase();
  if (/clean/.test(t)) return "foi-0419";
  if (/\bit\b|service desk|software|digital/.test(t)) return "foi-0398";
  if (/value|clinical|annual/.test(t)) return "foi-0412";
  return "foi-0425";
}

export default async function FoiCasePage(props: PageProps<"/foi/[id]">) {
  const { id } = await props.params;
  const sp = await props.searchParams;

  let req: FoiRequest | undefined;
  let caseId = id;
  if (id === "new") {
    const text = typeof sp.text === "string" ? sp.text : "";
    const received = typeof sp.received === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.received) ? sp.received : TODAY.toISOString().slice(0, 10);
    if (!text) notFound();
    caseId = templateFor(text);
    req = {
      id: "new",
      ref: "FOI-2026-0426",
      received,
      requester: "Not recorded",
      subject: text.length > 60 ? `${text.slice(0, 57).trim()}…` : text,
      text,
      status: "New",
      assignee: "sam",
    };
  } else {
    req = getFoi(id);
  }
  const kase = foiCases[caseId];
  if (!req || !kase) notFound();

  return (
    <div className="mx-auto max-w-[1180px]">
      <Button variant="link" asChild className="mb-3 h-auto px-0 text-muted-foreground">
        <Link href="/foi">
          <ChevronLeft data-icon="inline-start" /> FOI requests
        </Link>
      </Button>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="tnum mb-2 text-[13px] font-medium text-muted-foreground">{req.ref}</p>
          <h1 className="heading text-[2rem] text-balance">{req.subject}</h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          Officer <Person id={req.assignee} />
        </div>
      </header>
      <FoiWorkspace req={req} kase={kase} due={foiDue(req)} elapsed={foiElapsed(req)} />
    </div>
  );
}
