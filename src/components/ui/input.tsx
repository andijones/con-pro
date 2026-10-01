import * as React from "react"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      data-control=""
      className={cn(
        "control h-(--control-height) w-full min-w-0 px-3 py-1 text-base outline-none data-[slot=input-group-control]:control-bare file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:control-focus data-[slot=input-group-control]:focus-visible:control-bare disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:shadow-[inset_0_0_0_1px_var(--destructive),0_0_0_4px_color-mix(in_oklab,var(--destructive)_14%,transparent)] md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
