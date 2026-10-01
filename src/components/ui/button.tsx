import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

// Contravo: sizes raised to a 36px default, crafted surfaces, focus handled by the global outline (globals.css).
// Small sizes grow their hit area to --hit-min invisibly (hit-area utilities); press uses --press-scale.
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap press transition-[background-color,border-color,color,box-shadow,transform] duration-(--duration-fast) ease-(--ease-out) outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-(--shadow-button-primary) hover:bg-(--primary-hover) aria-expanded:bg-(--primary-hover)",
        outline:
          "border-border bg-background text-foreground shadow-(--shadow-button) hover:border-[color-mix(in_oklab,var(--border),var(--foreground)_10%)] hover:bg-muted/70 aria-expanded:bg-muted",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklab,var(--secondary),var(--primary)_10%)] aria-expanded:bg-[color-mix(in_oklab,var(--secondary),var(--primary)_10%)]",
        ghost: "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/15",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-2 px-3.5 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "hit-area-y h-7 gap-1 rounded-md px-2.5 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "hit-area-y h-8 gap-1.5 rounded-md px-3 text-[13px] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-4 has-data-[icon=inline-end]:pr-3.5 has-data-[icon=inline-start]:pl-3.5",
        icon: "hit-area size-9 in-data-[slot=button-group]:hit-area-y",
        "icon-xs": "hit-area size-7 rounded-md in-data-[slot=button-group]:rounded-lg in-data-[slot=button-group]:hit-area-y [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "hit-area size-8 rounded-md in-data-[slot=button-group]:rounded-lg in-data-[slot=button-group]:hit-area-y",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
