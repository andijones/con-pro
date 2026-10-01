"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { toast } from "sonner";
import { signIn, type SignInState } from "../auth-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

export function SignInForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const [show, setShow] = useState(false);
  const e = state.errors ?? {};

  return (
    <div className="mt-8 flex flex-col gap-6">
      {/* WCAG 3.3.1: an error summary that screen readers hear, linking to each field */}
      {(e.email || e.password) && (
        <div role="alert" className="rounded-lg border border-critical/30 bg-critical-muted px-4 py-3 text-sm text-critical">
          <p className="font-medium">Check the highlighted fields</p>
          <ul className="mt-1 list-disc pl-4">
            {e.email && (
              <li>
                <a href="#email" className="underline underline-offset-2">
                  {e.email}
                </a>
              </li>
            )}
            {e.password && (
              <li>
                <a href="#password" className="underline underline-offset-2">
                  {e.password}
                </a>
              </li>
            )}
          </ul>
        </div>
      )}

      <form action={action} noValidate>
        <input type="hidden" name="from" value={from} />
        <FieldGroup className="gap-5">
          <Field data-invalid={e.email ? true : undefined}>
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
          </Field>

          <Field data-invalid={e.password ? true : undefined}>
            <div className="flex items-baseline justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <button
                type="button"
                onClick={() => toast("Password reset (concept only)", { description: "Any password works here." })}
                className="hit-area-y text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
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
          </Field>

          <Label className="gap-2.5 text-sm font-normal">
            <Checkbox name="remember" defaultChecked /> Keep me signed in for 30 days
          </Label>

          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Spinner /> Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </FieldGroup>
      </form>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Separator className="flex-1" />
        or
        <Separator className="flex-1" />
      </div>

      <form action={action}>
        <input type="hidden" name="from" value={from} />
        <input type="hidden" name="email" value="priya.shah@northgate.nhs.uk" />
        <input type="hidden" name="password" value="sso" />
        <input type="hidden" name="remember" value="on" />
        <Button type="submit" variant="outline" size="lg" className="w-full" disabled={pending}>
          <Mail data-icon="inline-start" /> Continue with NHSmail
        </Button>
      </form>

      <p className="rounded-lg bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Concept build.</span> Any email and password will sign you in, and nothing is
        checked or stored. Sign out from the menu under your name.
      </p>
    </div>
  );
}

