import Link from "next/link";
import { Plus } from "lucide-react";
import { foiRequests } from "@/lib/data";
import { foiView } from "@/lib/foi-lifecycle";
import { FoiList } from "@/components/contravo/foi-list";
import { PageHeader } from "@/components/contravo/primitives";
import { Button } from "@/components/ui/button";

export const metadata = { title: "FOI requests" };

export default function FoiPage() {
  const requests = foiRequests.map(foiView);
  const yours = requests.filter((v) => v.owner.kind === "officer").length;
  return (
    <div>
      <PageHeader
        title="FOI requests"
        actions={
          <Button asChild>
            <Link href="/chat?tab=foi">
              <Plus data-icon="inline-start" /> New request
            </Link>
          </Button>
        }
      >
        {yours === 0 ? "Nothing needs you right now." : yours === 1 ? "One request needs you to act." : `${yours} requests need you to act.`} Every reply is due within
        20 working days, and the marks show where each one should have got to.
      </PageHeader>
      <FoiList requests={requests} />
    </div>
  );
}
