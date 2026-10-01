"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Search } from "lucide-react";
import { addWorkingDays, formatDate, TODAY } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

/** Paste a Freedom of Information request; the 20 working-day clock starts from the date received. */
export function FoiIntake() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [received, setReceived] = useState<Date>(TODAY);
  const [tried, setTried] = useState(false);
  const iso = received.toISOString().slice(0, 10);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) {
          setTried(true);
          document.getElementById("foi-text")?.focus();
          return;
        }
        router.push(`/foi/new?received=${iso}&text=${encodeURIComponent(text.trim())}`);
      }}
    >
      <FieldGroup>
        <Field data-invalid={tried && !text.trim() ? true : undefined}>
          <FieldLabel htmlFor="foi-text">Request</FieldLabel>
          <Textarea
            id="foi-text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the request exactly as it was received."
            className="text-base md:text-sm"
            aria-invalid={tried && !text.trim() ? true : undefined}
            aria-describedby="foi-text-hint"
          />
          {tried && !text.trim() && <FieldError>Paste the request before searching.</FieldError>}
          <FieldDescription id="foi-text-hint">Paste it word for word. The agent rewords it for searching, but the reply answers the original.</FieldDescription>
        </Field>
        <Field className="sm:w-72">
          <FieldLabel htmlFor="foi-received">Date received</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button id="foi-received" variant="outline" className="justify-start font-normal">
                <CalendarIcon data-icon="inline-start" />
                {formatDate(iso)}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={received} onSelect={(d) => d && setReceived(d)} disabled={{ after: TODAY }} />
            </PopoverContent>
          </Popover>
          <FieldDescription>
            The reply is due by <span className="font-medium text-foreground">{formatDate(addWorkingDays(iso, 20))}</span> (20 working days).
          </FieldDescription>
        </Field>
        <div>
          <Button type="submit">
            <Search data-icon="inline-start" /> Find contracts
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
