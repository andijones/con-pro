import { ShieldCheck } from "lucide-react";

/**
 * Signed-out shell: Frost page, the logo over one centred card, and the brand shimmer at the foot.
 * Decision record: docs/decisions/sign-in.md
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-muted px-4">
      <span className="shimmer-band -z-10" aria-hidden>
        <i />
      </span>

      <main id="main" className="flex flex-1 flex-col items-center justify-center py-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/contravo-logo.svg" alt="Contravo" width={132} height={26} className="mb-8 h-[26px] w-auto" />
        <div className="w-full max-w-[420px] rounded-2xl bg-card p-8 shadow-(--shadow-raised) sm:p-10">{children}</div>
      </main>

      {/* Sits over the shimmer, which reaches deep Lilac: darker than muted text so it stays above 4.5:1 everywhere */}
      <footer className="flex flex-col items-center gap-2 pb-8 text-center text-xs text-foreground/80">
        <span>
          <ShieldCheck className="mr-1.5 inline size-3.5 -translate-y-px" aria-hidden />
          Data stored in the UK · Cyber Essentials Plus · DSPT compliant
        </span>
        <span className="flex gap-4">
          <a href="https://contravo.ai/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </a>
          <a href="mailto:hello@contravo.ai" className="underline-offset-4 hover:underline">
            Get help
          </a>
        </span>
      </footer>
    </div>
  );
}
