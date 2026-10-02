import { ShieldCheck } from "lucide-react";
import { EvidencePanel } from "./evidence-panel";

/**
 * Signed-out shell: form column + the Evidence panel.
 * Decision record: docs/decisions/sign-in.md
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main id="main" className="flex flex-col px-6 py-8 sm:px-12">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/contravo-logo.svg" alt="Contravo" width={122} height={24} className="h-6 w-auto self-start" />
        <div className="mx-auto flex w-full max-w-[380px] flex-1 flex-col justify-center py-12">{children}</div>
        <footer className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span>
            <ShieldCheck className="mr-1.5 inline size-3.5 -translate-y-px" aria-hidden />
            Data stored in the UK · Cyber Essentials Plus · DSPT compliant
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
      {/* Lives in the layout, so it plays once and doesn't replay between sign-in and forgot password */}
      <EvidencePanel />
    </div>
  );
}
