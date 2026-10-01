"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReportActions({ title }: { title: string }) {
  return (
    <div className="flex w-full gap-2">
      <Button size="sm" onClick={() => toast.success(`${title} is being generated`, { description: "It will appear in your downloads." })}>
        Generate
      </Button>
      <Button size="sm" variant="ghost" onClick={() => toast(`${title} will be emailed every Monday at 08:00`)}>
        Schedule
      </Button>
    </div>
  );
}
