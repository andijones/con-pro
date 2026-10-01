import { ShieldCheck } from "lucide-react";
import { SignInForm } from "./sign-in-form";

export const metadata = { title: "Sign in" };

export default async function SignInPage(props: PageProps<"/sign-in">) {
  const sp = await props.searchParams;
  const from = typeof sp.from === "string" ? sp.from : "/";

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Form */}
      <main id="main" className="flex flex-col px-6 py-8 sm:px-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/contravo-logo.svg" alt="Contravo" width={122} height={24} className="h-6 w-auto self-start" />

        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">
          <h1 className="heading text-[2rem]">Sign in</h1>
          <p className="mt-2 text-base text-muted-foreground">Use your NHS or council work email.</p>
          <SignInForm from={from} />
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden /> Data stored in the UK · Cyber Essentials Plus · DSPT compliant
          </span>
          <span className="flex gap-4">
            <a href="https://contravo.ai/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
              Privacy
            </a>
            <a href="mailto:hello@contravo.ai" className="underline-offset-4 hover:text-foreground hover:underline">
              Get help
            </a>
          </span>
        </footer>
      </main>

      {/* Brand panel: the brand guide's signature gradient (Iris top-left → Signal violet bottom-right), emblem pattern at low intensity */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-[linear-gradient(135deg,var(--brand-iris)_0%,var(--brand-violet)_55%,var(--brand-midnight)_120%)] lg:block"
      >
        <div className="pointer-events-none absolute inset-0 bg-[url(/contravo-pattern-tile.svg)] bg-size-[72px_72px] opacity-[0.08] select-none" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/contravo-mark-white.svg"
          alt=""
          width={560}
          height={560}
          className="pointer-events-none absolute -right-28 -bottom-28 size-[560px] opacity-[0.14] select-none"
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/contravo-mark-white.svg" alt="" width={36} height={36} className="size-9" />
          <div className="max-w-[460px]">
            <p className="text-[3.25rem] leading-[1.02] tracking-[-0.04em] text-balance">Every agreement. Clearer decisions.</p>
            <p className="mt-5 max-w-[42ch] text-lg leading-relaxed text-white/85">
              Every contract you hold, read. Every deadline in view, with the clause as proof.
            </p>
          </div>
          <p className="text-sm text-white/70">Built for the public sector.</p>
        </div>
      </aside>
    </div>
  );
}
