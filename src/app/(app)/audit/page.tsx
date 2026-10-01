import { AuditLog } from "@/components/contravo/audit-log";
import { PageHeader } from "@/components/contravo/primitives";

export const metadata = { title: "Audit" };

export default function AuditPage() {
  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader title="Audit">
        Everything that happened in this workspace, newest first. Contravo’s own actions are included, and anything Contravo staff do
        is marked with the reason they gave.
      </PageHeader>
      <div className="mt-6">
        <AuditLog />
      </div>
    </div>
  );
}
