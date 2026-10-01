import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      data-control=""
      className={cn(
        "control flex field-sizing-content min-h-20 w-full px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:control-focus data-[slot=input-group-control]:control-bare data-[slot=input-group-control]:focus-visible:control-bare disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_0_0_1px_var(--destructive),0_0_0_4px_color-mix(in_oklab,var(--destructive)_14%,transparent)] md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
