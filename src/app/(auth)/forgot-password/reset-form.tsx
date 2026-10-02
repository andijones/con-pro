"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { RESET_EMAIL_KEY } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { AuthHeading } from "../auth-heading";

function emailError(v: string) {
  const email = v.trim();
  if (!email) return "Enter your work email address.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "Enter an email address like name@trust.nhs.uk.";
}

/** Concept only: nothing is sent. The confirmation never says whether the account exists. */
export function ResetForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const input = useRef<HTMLInputElement>(null);

  // Prefill from the sign-in form, if they'd typed an email there
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(RESET_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  function submit(e: FormEvent) {
    e.preventDefault();
    const err = emailError(email);
    setError(err);
    if (err) return input.current?.focus();
    setStatus("sending");
    setTimeout(() => setStatus("sent"), 700);
  }

  const back = (
    <Link
      href="/sign-in"
      className="hit-area-y mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      <ArrowLeft className="size-4" aria-hidden /> Back to sign in
    </Link>
  );

  if (status === "sent") {
    return (
      <div key="sent" className="flex flex-col">
        <AuthHeading
          lede={
            <>
              If <span className="font-medium text-foreground">{email.trim()}</span> has a Contravo account, we’ve sent it a link to set a new
              password. The link works for 30 minutes.
            </>
          }
        >
          Check your email
        </AuthHeading>
        <p className="mt-6 rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
          Nothing after a few minutes? Check your junk folder, or{" "}
          <button
            type="button"
            onClick={() => toast("Reset link sent again", { description: `Check ${email.trim()}, including your junk folder.` })}
            className="font-medium text-primary underline underline-offset-4"
          >
            send it again
          </button>
          .
        </p>
        {back}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <AuthHeading lede="Enter your work email and we’ll send you a link to set a new one.">Reset your password</AuthHeading>
      <form onSubmit={submit} noValidate className="mt-8 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="reset-email">Work email</FieldLabel>
          <Input
            ref={input}
            id="reset-email"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@trust.nhs.uk"
            value={email}
            onChange={(ev) => {
              setEmail(ev.target.value);
              if (error) setError(emailError(ev.target.value)); // once wrong, re-check as they type
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "reset-email-error" : undefined}
            className="h-10"
          />
          {error && <FieldError id="reset-email-error">{error}</FieldError>}
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={status === "sending"}>
          {status === "sending" ? (
            <>
              <Spinner /> Sending…
            </>
          ) : (
            "Send reset link"
          )}
        </Button>
      </form>
      {back}
    </div>
  );
}
