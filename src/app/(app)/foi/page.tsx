import { foiRequests } from "@/lib/data";
import { FoiList } from "@/components/contravo/foi-list";

export const metadata = { title: "FOI requests" };

export default function FoiPage() {
  return (
    <div>
      <FoiList seed={foiRequests} />
    </div>
  );
}
