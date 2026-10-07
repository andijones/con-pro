import * as React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Suggested prompts, as a quiet list ("Quiet list", docs/decisions/ask-composer.md): plain rows divided by hairlines,
 * with no rim, glow or card, so the composer stays the one AI moment on the page. Used for Try asking, follow-ups,
 * the Ask drawer and Recent chats.
 * - `icon` (optional) leads the row in Violet; `meta` (optional) trails it, e.g. a date
 * - hover tints the row and shows an arrow; keyboard focus is the global Midnight outline
 * - the row bleeds 0.5rem past the column on each side, so its text lines up with headings above
 * The earlier glowing pill lives on as HaloSuggestion (halo-suggestion.tsx) for the prototypes.
 */

function PromptSuggestions({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="prompt-suggestions" className={cn("flex flex-col divide-y divide-(--brand-line)", className)} {...props} />
}

function PromptSuggestion({
  className,
  icon: Icon,
  meta,
  type = "button",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  /** A lucide icon for the topic */
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  /** Trailing detail, such as a date; replaces the hover arrow */
  meta?: React.ReactNode
}) {
  return (
    <li data-slot="prompt-suggestion">
      <button
        type={type}
        className={cn(
          "group/suggestion -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-2.5 text-left text-sm text-foreground",
          "transition-colors duration-(--duration-fast) ease-(--ease-out) hover:bg-muted",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {Icon && <Icon className="size-4 shrink-0 text-primary" aria-hidden />}
        <span className="min-w-0 flex-1 text-pretty group-hover/suggestion:text-primary">{children}</span>
        {meta != null ? (
          <span className="tnum shrink-0 text-xs text-muted-foreground">{meta}</span>
        ) : (
          <ArrowRight
            className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-(--duration-fast) group-hover/suggestion:opacity-100 group-focus-visible/suggestion:opacity-100"
            aria-hidden
          />
        )}
      </button>
    </li>
  )
}

export { PromptSuggestion, PromptSuggestions }
