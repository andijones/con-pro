"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

export function AskBar() {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form
      role="search"
      className="w-full max-w-xl"
      onSubmit={(e) => {
        e.preventDefault();
        const q = ref.current?.value.trim();
        if (q && ref.current) {
          router.push(`/chat?q=${encodeURIComponent(q)}`);
          ref.current.value = "";
          ref.current.blur();
        }
      }}
    >
      <InputGroup className="h-9 bg-muted/60">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          ref={ref}
          name="q"
          autoComplete="off"
          aria-label="Ask about any contract"
          placeholder="Ask about any contract, e.g. which contracts can we end early?"
          className="text-base md:text-sm"
        />
        <InputGroupAddon align="inline-end" className="hidden sm:flex">
          <Kbd>⌘K</Kbd>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
