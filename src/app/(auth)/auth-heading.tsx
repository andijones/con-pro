"use client";

import { useEffect, useRef, type ReactNode } from "react";

// First page load keeps the browser's default focus; later views (client navigation, a state swap) take it,
// so focus never falls back to <body> when the link or button that was used disappears.
let loaded = false;

export function AuthHeading({ children, lede }: { children: ReactNode; lede?: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (loaded) ref.current?.focus({ preventScroll: true });
    loaded = true;
  }, []);
  return (
    <>
      <h1 ref={ref} tabIndex={-1} className="page-title text-balance">
        {children}
      </h1>
      {lede && <p className="mt-2 text-base text-muted-foreground">{lede}</p>}
    </>
  );
}
