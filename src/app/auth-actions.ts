"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/session";

export type SignInState = { errors?: { email?: string; password?: string }; email?: string };

/** Concept sign-in: accepts any email and password, sets a session cookie. */
export async function signIn(_prev: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const errors: SignInState["errors"] = {};
  if (!email) errors.email = "Enter your work email address.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = "Enter an email address like name@trust.nhs.uk.";
  if (!password) errors.password = "Enter your password.";
  if (errors.email || errors.password) return { errors, email };

  (await cookies()).set(SESSION_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: form.get("remember") ? 60 * 60 * 24 * 30 : undefined, // "Keep me signed in": 30 days, else this browser session
  });

  const from = String(form.get("from") ?? "/");
  redirect(from.startsWith("/") && !from.startsWith("//") ? from : "/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/sign-in");
}
