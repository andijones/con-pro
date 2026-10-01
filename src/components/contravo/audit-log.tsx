"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bot, CalendarIcon, Download, ShieldAlert, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { audit, auditActionOf, auditActions, people } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PersonAvatar } from "./primitives";

const ALL = "__all";
const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function AuditLog() {
  const [action, setAction] = useState(ALL);
  const [range, setRange] = useState<DateRange | undefined>();

  const rows = useMemo(() => {
    return [...audit]
      .sort((a, b) => b.at.localeCompare(a.at))
      .filter((e) => {
        if (action !== ALL && auditActionOf(e) !== action) return false;
        const t = new Date(e.at);
        if (range?.from && t < new Date(new Date(range.from).setHours(0, 0, 0, 0))) return false;
        if (range?.to && t > new Date(new Date(range.to).setHours(23, 59, 59, 999))) return false;
        return true;
      });
  }, [action, range]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-56">
          <FieldLabel htmlFor="a-action" className="text-xs text-muted-foreground">
            Action
          </FieldLabel>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger id="a-action" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All actions</SelectItem>
              <SelectSeparator />
              {auditActions.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field className="w-auto">
          <FieldLabel htmlFor="a-range" className="text-xs text-muted-foreground">
            From – to
          </FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="a-range" variant="outline" className="min-w-56 justify-start font-normal">
                <CalendarIcon data-icon="inline-start" />
                {range?.from ? (
                  <span className="tnum">
                    {fmt(range.from)}
                    {range.to ? ` – ${fmt(range.to)}` : ""}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Any date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} defaultMonth={new Date(2026, 8, 1)} />
            </PopoverContent>
          </Popover>
        </Field>
        {(action !== ALL || range) && (
          <Button
            variant="ghost"
            onClick={() => {
              setAction(ALL);
              setRange(undefined);
            }}
          >
            <X data-icon="inline-start" /> Clear
          </Button>
        )}
        <Button variant="outline" className="ml-auto" onClick={() => toast.success(`Exported ${rows.length} events`, { description: "CSV, signed with a checksum for auditors" })}>
          <Download data-icon="inline-start" /> Export for auditors
        </Button>
      </div>

      <Card className="py-0">
        {rows.length ? (
          <Table scrollLabel="Audit trail">
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="pl-4">Who</TableHead>
                <TableHead>What happened</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="pr-4 text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => {
                const p = people[e.who];
                return (
                  <TableRow key={e.at + e.what}>
                    <TableCell className="w-52 py-3 pl-4">
                      <span className="flex items-center gap-2">
                        {p ? (
                          <PersonAvatar id={e.who} decorative />
                        ) : (
                          <span aria-hidden className="grid size-6 place-items-center rounded-full bg-foreground text-background">
                            {e.staff ? <ShieldAlert className="size-3" aria-hidden /> : <Bot className="size-3" aria-hidden />}
                          </span>
                        )}
                        <span className={p ? "font-medium" : "text-muted-foreground"}>{p?.name ?? e.staff?.name ?? "Contravo"}</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3 whitespace-normal">
                      <span className="text-muted-foreground">{e.what}</span>{" "}
                      {e.href ? (
                        <Link href={e.href} className="font-medium underline decoration-muted-foreground/50 underline-offset-2 hover:text-primary hover:decoration-primary">
                          {e.target}
                        </Link>
                      ) : (
                        <span className="font-medium">{e.target}</span>
                      )}
                      {e.staff && (
                        <p className="mt-1 text-xs text-warning">
                          <span className="font-medium">Contravo staff action. Reason given:</span> {e.staff.reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.staff ? "warning" : "outline"}>{auditActionOf(e)}</Badge>
                    </TableCell>
                    <TableCell className="tnum pr-4 text-right text-xs text-muted-foreground">
                      {new Date(e.at).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyTitle>Nothing happened in that range</EmptyTitle>
              <EmptyDescription>Try a wider date range or a different action.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </Card>
    </div>
  );
}
