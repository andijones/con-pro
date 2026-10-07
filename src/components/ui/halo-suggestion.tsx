import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Retired 7 October 2026 for the quiet list (prompt-suggestion.tsx); kept for the /proto/chat concepts that use it.
 * Suggested prompts: AI suggestions the user can ask with one click.
 * The Halo Button effect (cult-ui.com/docs/components/halo-button) rebuilt in CSS on the composer tokens: brand
 * gradient blobs drift along a 1px rim and glow softly through a frosted fill. CSS rather than Motion because a
 * screen can hold several of these at once; each animates on the compositor only (transform, opacity).
 * Tokens: --suggestion-* plus the --composer-rim-* gradients. Styles: .prompt-suggestion in globals.css.
 */

function HaloSuggestions({
  className,
  stacked = false,
  children,
  ...props
}: React.ComponentProps<"ul"> & {
  /** One per row, full width (narrow places such as the Ask drawer) */
  stacked?: boolean
}) {
  return (
    <ul
      data-slot="prompt-suggestions"
      className={cn("flex gap-2", stacked ? "flex-col" : "flex-wrap", className)}
      {...props}
    >
      {React.Children.map(children, (child, i) =>
        React.isValidElement<{ index?: number; stacked?: boolean }>(child) ? (
          <li className={cn(stacked && "w-full")}>{React.cloneElement(child, { index: child.props.index ?? i, stacked })}</li>
        ) : (
          child
        )
      )}
    </ul>
  )
}

function HaloSuggestion({
  className,
  index = 0,
  stacked = false,
  type = "button",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  /** Position in its group: offsets the drift so neighbours never glow in step */
  index?: number
  stacked?: boolean
}) {
  return (
    <span
      data-slot="prompt-suggestion"
      className={cn("prompt-suggestion", stacked && "w-full rounded-(--suggestion-radius-stacked)")}
      style={{ "--i": index } as React.CSSProperties}
    >
      <span className="prompt-suggestion-rim" aria-hidden />
      <button
        type={type}
        className={cn(
          "prompt-suggestion-surface relative flex min-h-10 w-full items-center rounded-[inherit] px-4 py-2 text-left text-sm text-foreground",
          "transition-[background,box-shadow,scale] duration-(--duration-fast) ease-(--ease-out) active:scale-(--press-scale)",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </button>
    </span>
  )
}

export { HaloSuggestion, HaloSuggestions }
