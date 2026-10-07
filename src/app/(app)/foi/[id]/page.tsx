import { notFound } from "next/navigation";
import { foiRequests, getFoi, type FoiRequest } from "@/lib/data";
import { foiCases } from "@/lib/foi-cases";
import { TODAY } from "@/lib/dates";
import { FoiWorkspace } from "@/components/contravo/foi-workspace";
import { BackLink, PageHeader, Person } from "@/components/contravo/primitives";

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
      reviewer: "helen",
    };
  } else {
    req = getFoi(id);
  }
  const kase = foiCases[caseId];
  if (!req || !kase) notFound();

  return (
    <div>
      <PageHeader
        title={req.subject}
        leading={<BackLink href="/foi" label="FOI requests" />}
        actions={
          <span className="flex items-center gap-2 text-[13px] text-muted-foreground">
            Officer <Person id={req.assignee} />
          </span>
        }
      />
      <p className="tnum mb-6 text-[13px] font-medium text-muted-foreground">{req.ref}</p>
      <FoiWorkspace req={req} kase={kase} />
    </div>
  );
}
