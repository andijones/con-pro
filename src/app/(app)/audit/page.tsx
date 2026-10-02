import { AuditFeed } from "@/components/contravo/audit-feed";

export const metadata = { title: "Audit" };

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-[860px]">
      <AuditFeed />
    </div>
  );
}
