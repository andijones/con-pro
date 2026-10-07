"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn, type SignInState } from "@/app/auth-actions";
import { RESET_EMAIL_KEY } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";

export function SignInForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const e = state.errors ?? {};

  // After a failed submit, take the user straight to the first field that needs fixing
  useEffect(() => {
    form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  // Carry the typed email to the reset page without putting it in the URL
  function rememberEmail() {
    const email = form.current?.querySelector<HTMLInputElement>("#email")?.value.trim();
    try {
      if (email) sessionStorage.setItem(RESET_EMAIL_KEY, email);
    } catch {}
  }

  return (
    <form ref={form} action={action} noValidate className="mt-7 flex flex-col gap-5">
      <input type="hidden" name="from" value={from} />
      <div className="flex flex-col gap-2">
        <FieldLabel htmlFor="email">Work email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={state.email}
          placeholder="name@trust.nhs.uk"
          aria-invalid={e.email ? true : undefined}
          aria-describedby={e.email ? "email-error" : undefined}
          className="h-10"
        />
        {e.email && <FieldError id="email-error">{e.email}</FieldError>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Link
            href="/forgot-password"
            onClick={rememberEmail}
            className="hit-area-y text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <InputGroup className="h-10">
          <InputGroupInput
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={e.password ? true : undefined}
            aria-describedby={e.password ? "password-error" : undefined}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              aria-label={show ? "Hide password" : "Show password"}
              aria-pressed={show}
              onClick={() => setShow((s) => !s)}
            >
              {show ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {e.password && <FieldError id="password-error">{e.password}</FieldError>}
      </div>

      <Label className="gap-2.5 text-sm font-normal">
        <Checkbox name="remember" defaultChecked /> Keep me signed in for 30 days
      </Label>

      <Button type="submit" size="lg" className="mt-1 w-full" disabled={pending}>
        {pending ? (
          <>
            <Spinner /> Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
