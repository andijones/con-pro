"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Concept only: drafting a statutory publication. Nothing is published without someone checking it. */
export function ReportActions({ title }: { title: string }) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => toast.success("Draft ready to check", { description: `${title}. Nothing is published until you approve it.` })}
    >
      Prepare draft
    </Button>
  );
}
