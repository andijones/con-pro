"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The product's core move, shown instead of a slogan: a question, an answer with a citation,
 * and the clause it came from. Plays once in under 5 seconds (WCAG 2.2.2 needs no pause control
 * below that), then rests. Reduced motion lands on the final frame. Decorative, so hidden from AT.
 */
export function EvidencePanel() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setStep(4);
    const timers = [400, 1300, 2300, 3200].map((ms, i) => setTimeout(() => setStep(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  const shown = (n: number) =>
    cn("transition-[opacity,translate] duration-300 ease-(--ease-out)", step >= n ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0");

  return (
    <aside aria-hidden className="relative hidden overflow-hidden border-l bg-muted lg:flex lg:flex-col lg:justify-center">
      <div className="pointer-events-none absolute inset-0 bg-[url(/contravo-pattern-tile.svg)] bg-size-[72px_72px] opacity-[0.05] select-none" />
      <div className="relative mx-auto flex w-full max-w-[480px] flex-col gap-4 px-10">
        <p className="text-xs tracking-[0.06em] text-muted-foreground uppercase">Example</p>

        <p className={cn("self-end rounded-xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground", shown(1))}>
          Can we end the imaging contract early?
        </p>

        <div className={cn("rounded-xl border bg-card p-4 text-sm leading-relaxed shadow-[0_1px_2px_rgb(3_1_57/0.04)]", shown(2))}>
          Yes, on six months’ written notice, but not before the end of year three.
          <span className="tnum mr-1 ml-0.5 inline-grid h-[18px] min-w-[18px] -translate-y-px place-items-center rounded bg-secondary px-1 align-middle text-[11px] font-medium text-secondary-foreground">
            1
          </span>
          The earliest date that works is 31 March 2027.
        </div>

        <figure className={cn("rounded-xl border bg-card shadow-[0_1px_2px_rgb(3_1_57/0.04),0_16px_40px_-16px_rgb(3_1_57/0.16)]", shown(3))}>
          <figcaption className="flex items-center gap-2 border-b px-4 py-2.5 text-xs">
            <FileText className="size-3.5 text-muted-foreground" />
            <span className="font-medium">Clause 14.2 · Termination for convenience</span>
          </figcaption>
          <p className="px-4 py-3 font-document text-[13px] leading-relaxed text-foreground/80">
            The Trust may terminate this Agreement without cause{" "}
            <span className="clause-mark px-0.5" data-active={step >= 4}>
              by giving not less than six (6) months’ written notice, provided that such notice shall not expire before the third anniversary
            </span>{" "}
            of the Commencement Date.
          </p>
        </figure>

        <p className={cn("mt-4 max-w-[38ch] text-lg leading-snug text-balance", shown(4))}>
          Every answer shows the clause it came from, so you can check it before you act.
        </p>
      </div>
    </aside>
  );
}
