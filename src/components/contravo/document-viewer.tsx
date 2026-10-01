"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { DocBlock, DocPage } from "@/lib/extraction";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";

function Highlight({ text, quote }: { text: string; quote?: string }) {
  if (!quote) return <>{text}</>;
  const i = text.toLowerCase().indexOf(quote.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark data-highlight className="rounded-sm bg-highlight px-0.5 text-foreground ring-2 ring-ring/60">
        {text.slice(i, i + quote.length)}
      </mark>
      {text.slice(i + quote.length)}
    </>
  );
}

function Block({ b, quote }: { b: DocBlock; quote?: string }) {
  switch (b.kind) {
    case "title":
      return <p className="mb-2 text-center font-sans text-xs tracking-[0.14em] text-muted-foreground uppercase">{b.text}</p>;
    case "h":
      return (
        <h3 className="mt-6 mb-3 text-center font-sans text-[15px] font-semibold first:mt-0">
          <Highlight text={b.text} quote={quote} />
        </h3>
      );
    case "li":
      return (
        <li className="ml-6 list-[lower-roman] pl-1">
          <Highlight text={b.text} quote={quote} />
        </li>
      );
    case "table":
      return (
        <table className="my-4 w-full border-collapse font-document text-[13px]">
          <thead>
            <tr>
              {b.head.map((h) => (
                <th key={h} className="border border-foreground/60 px-2 py-1.5 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className="border border-foreground/60 px-2 py-1.5">
                    <Highlight text={cell} quote={quote} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    default:
      return (
        <p className="mb-3">
          <Highlight text={b.text} quote={quote} />
        </p>
      );
  }
}

/** Consecutive list items become one <ol> so the document reads as a list (WCAG 1.3.1). */
function groupLists(blocks: DocBlock[]): (DocBlock | DocBlock[])[] {
  const out: (DocBlock | DocBlock[])[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (b.kind === "li" && Array.isArray(last)) last.push(b);
    else out.push(b.kind === "li" ? [b] : b);
  }
  return out;
}

/** A paged document viewer. Pages scroll continuously; the page box follows the scroll position. */
export function DocumentViewer({
  pages,
  focus,
}: {
  pages: DocPage[];
  /** Ask the viewer to jump to a page (and highlight a quote). Change nonce to re-trigger. */
  focus?: { page: number; quote?: string; nonce: number };
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const jump = useCallback((n: number, toHighlight = false) => {
    const root = scroller.current;
    const el = root?.querySelector<HTMLElement>(`[data-page="${n}"]`);
    if (!root || !el) return;
    const mark = toHighlight ? el.querySelector<HTMLElement>("[data-highlight]") : null;
    const top = (mark ? mark.getBoundingClientRect().top - 140 : el.getBoundingClientRect().top - 16) - root.getBoundingClientRect().top;
    root.scrollBy({ top, behavior: "smooth" });
    setPage(n);
  }, []);

  useEffect(() => {
    if (!focus) return;
    // wait a frame so the highlight mark is rendered
    const id = requestAnimationFrame(() => jump(focus.page, true));
    return () => cancelAnimationFrame(id);
  }, [focus, jump]);

  function onScroll() {
    const root = scroller.current;
    if (!root) return;
    const rootTop = root.getBoundingClientRect().top + 80;
    let current = 1;
    root.querySelectorAll<HTMLElement>("[data-page]").forEach((el) => {
      if (el.getBoundingClientRect().top <= rootTop) current = Number(el.dataset.page);
    });
    setPage(current);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label="Previous page" disabled={page <= 1} onClick={() => jump(page - 1)}>
            <ChevronLeft />
          </Button>
          <Input
            aria-label="Page"
            className="tnum h-7 w-12 px-1 text-center"
            key={page}
            defaultValue={page}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              const n = Number(e.currentTarget.value);
              if (n >= 1 && n <= pages.length) jump(n);
            }}
          />
          <span className="tnum text-sm text-muted-foreground">/ {pages.length}</span>
          <Button variant="ghost" size="icon-sm" aria-label="Next page" disabled={page >= pages.length} onClick={() => jump(page + 1)}>
            <ChevronRight />
          </Button>
        </div>
        <ButtonGroup>
          <Button variant="outline" size="icon-sm" aria-label="Zoom out" disabled={zoom <= 0.6} onClick={() => setZoom((z) => Math.round((z - 0.1) * 10) / 10)}>
            <ZoomOut />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setZoom(1)} className="tnum w-14">
            {zoom === 1 ? "Fit" : `${Math.round(zoom * 100)}%`}
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((z) => Math.round((z + 0.1) * 10) / 10)}>
            <ZoomIn />
          </Button>
        </ButtonGroup>
      </div>
      <div ref={scroller} onScroll={onScroll} tabIndex={0} role="region" aria-label="Document" className="relative min-h-0 flex-1 overflow-auto bg-muted p-4 sm:p-6">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4" style={{ zoom }}>
          {pages.map((p) => (
            <article
              key={p.number}
              data-page={p.number}
              aria-label={`Page ${p.number}`}
              className={cn(
                "relative min-h-[420px] rounded-sm bg-background px-8 py-10 font-document text-[14px] leading-[1.65] text-foreground shadow-sm sm:px-14",
                focus?.page === p.number && "ring-2 ring-ring/50",
              )}
            >
              <span className="absolute top-4 right-6 font-sans text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Page {p.number}
                {p.label ? ` · ${p.label}` : ""}
              </span>
              {groupLists(p.blocks).map((g, i) =>
                Array.isArray(g) ? (
                  <ol key={i} className="mb-3">
                    {g.map((b, j) => (
                      <Block key={j} b={b} quote={focus?.page === p.number ? focus.quote : undefined} />
                    ))}
                  </ol>
                ) : (
                  <Block key={i} b={g} quote={focus?.page === p.number ? focus.quote : undefined} />
                ),
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
