"use client"

/**
 * Contravo: installed from @cult-ui/halo-input and re-coloured to the brand (Iris, Violet, Mint, deep Lilac).
 * Opaque by default (the halo shows through the 1px rim). `translucent` frosts the surface, kept at 84–90% white with
 * no dark Violet underneath, so muted text stays above 4.5:1 wherever the colour drifts.
 * `HaloShell` is exported so composed controls (the chat composer's InputGroup) can sit inside the same shell.
 *
 * Single-line and multiline text controls with the same frosted + gradient-rim polish as
 * {@link HaloSegmented} / {@link HaloSwitch} — for generic forms (not search- or
 * composer-specific shaders, staggered placeholders, or trailing send/clear chrome).
 */
import { forwardRef, useId, type ComponentProps, type ReactNode } from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

/** Inset 1px inside `rounded-xl` shell → inner radius 12px − 1px = 11px (concentric with `SelectGradientUnderlay`). */
const RIM_RADIUS = "rounded-[11px]"
/** Inner padding box inside the 1px border: 11px − 1px = 10px. */
const CONTENT_RADIUS = "rounded-[10px]"

interface ShellProps {
  children: ReactNode
  className?: string
  translucent?: boolean
  invalid?: boolean
  /** The agent is working: the halo brightens and moves faster. */
  busy?: boolean
  /** Extra classes on the frosted inner (border + focus ring target). */
  innerClassName?: string
}

export function HaloShell({
  children,
  className,
  innerClassName,
  translucent = false,
  invalid,
  busy = false,
}: ShellProps) {
  const reduceMotion = useReducedMotion() ?? false
  const pace = busy ? 0.45 : 1

  return (
    <div
      className={cn(
        "relative isolate w-full max-w-full rounded-xl p-px",
        className
      )}
      data-slot="halo-input-shell"
    >
      {/*
        Clip to the same 11px round as the shell (not `rounded-xl`) so the rim and gradient share one curve —
        matches `SelectGradientUnderlay` / `HaloSwitch` underglow.
      */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[11px]">
        {/* Static brand bloom: always on, so the whole rim carries colour, not just the bottom edge */}
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "conic-gradient(from 200deg at 50% 50% in oklab, var(--brand-iris), var(--halo-mint), var(--brand-lilac-deep), var(--brand-iris), var(--halo-mint), var(--brand-lilac-deep), var(--brand-iris))",
          }}
        />
        {translucent ? (
          <div
            className={cn(
              "absolute inset-0",
              reduceMotion ? "opacity-[0.38]" : "opacity-50"
            )}
          >
            <div
              className="absolute inset-0 blur-2xl"
              style={{
                background:
                  "radial-gradient(90% 70% at 50% 100%, color-mix(in oklab, var(--brand-iris) 28%, transparent), color-mix(in oklab, var(--brand-violet) 12%, transparent) 48%, transparent 62%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-70 blur-xl dark:opacity-50"
              style={{
                background:
                  "radial-gradient(70% 55% at 30% 0%, color-mix(in oklab, var(--halo-mint) 30%, transparent), color-mix(in oklab, var(--halo-mint) 10%, transparent) 45%, transparent 58%)",
              }}
            />
          </div>
        ) : null}
        <motion.div
          animate={{
            opacity: busy ? 1 : translucent ? 0.72 : 0.85,
          }}
          className="absolute inset-x-0 bottom-0 h-1/2"
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <motion.div
            animate={{ left: ["-5%", "75%", "-5%"] }}
            className="-bottom-4 absolute h-14 w-44 blur-xl"
            style={{
              background:
                "linear-gradient(90deg in oklab, var(--brand-iris), var(--brand-lilac-deep), var(--halo-mint), var(--brand-iris))",
            }}
            transition={{
              duration: reduceMotion ? 0.01 : 6 * pace,
              ease: "easeInOut",
              repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            }}
          />
          <motion.div
            animate={{ left: ["65%", "10%", "65%"] }}
            className="-bottom-3 absolute h-11 w-36 blur-lg"
            style={{
              background: "linear-gradient(90deg in oklab, var(--halo-mint), var(--brand-iris), var(--brand-lilac-deep))",
            }}
            transition={{
              duration: reduceMotion ? 0.01 : 5 * pace,
              ease: "easeInOut",
              repeat: reduceMotion ? 0 : Number.POSITIVE_INFINITY,
            }}
          />
        </motion.div>
      </div>

      {/*
        Shell stack (aligned with `HaloSelectTrigger`): border + lift on the surface; inset rim on `::before`
        so backdrop-filter does not composite the top highlight against the outer glow at corners.
      */}
      <div
        className={cn(
          "relative z-1 border border-transparent outline-none",
          "shadow-[0_1px_2px_rgb(3_1_57/0.04),0_6px_18px_rgb(3_1_57/0.05)]",
          /* Inset rim only — concentric with 11px border − 1px (see `CONTENT_RADIUS`). */
          "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:rounded-[10px] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] before:content-['']",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          /* Focus (fields): the 1px Violet edge and soft halo, only while the text field itself is focused */
          "has-[textarea:focus-visible,input:focus-visible]:border-(--control-focus-edge) has-[textarea:focus-visible,input:focus-visible]:shadow-[0_0_0_3px_var(--control-halo)]",
          invalid &&
            "border-destructive has-[textarea:focus-visible,input:focus-visible]:border-destructive has-[textarea:focus-visible,input:focus-visible]:shadow-[0_0_0_3px_var(--control-invalid-halo)]",
          RIM_RADIUS,
          translucent && "backdrop-blur-xl backdrop-saturate-150",
          innerClassName
        )}
        style={{
          background: translucent
            ? "linear-gradient(to bottom, color-mix(in oklch, var(--card) 90%, transparent) 0%, color-mix(in oklch, var(--card) 84%, transparent) 100%)"
            : "var(--card)",
        }}
      >
        <div className="relative z-1">{children}</div>
      </div>
    </div>
  )
}

const inputInnerClassName = cn(
  "min-h-0 w-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-base shadow-none outline-none md:text-sm",
  "text-foreground placeholder:text-muted-foreground",
  "transition-[color,opacity] duration-200 ease-out",
  "focus-visible:ring-0",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:ring-0"
)

export type HaloInputProps = Omit<
  ComponentProps<typeof InputPrimitive>,
  "size"
> & {
  /** Frosted fill + gradient rim (matches segmented / switch). */
  translucent?: boolean
  invalid?: boolean
  leadingSlot?: ReactNode
  trailingSlot?: ReactNode
  shellClassName?: string
  /** Classes on the inner flex row (not the outer rim). */
  innerRowClassName?: string
}

/**
 * Single-line text input with cult-pro chrome. Use with {@link HaloField} + label `htmlFor`.
 */
export const HaloInput = forwardRef<HTMLInputElement, HaloInputProps>(
  function HaloInput(
    {
      className,
      translucent = true,
      invalid,
      leadingSlot,
      trailingSlot,
      shellClassName,
      innerRowClassName,
      id: idProp,
      "aria-invalid": ariaInvalid,
      ...inputProps
    },
    ref
  ) {
    const uid = useId()
    const id = idProp ?? uid
    const isInvalid =
      Boolean(invalid) || ariaInvalid === true || ariaInvalid === "true"
    const invalidFlag = isInvalid || undefined

    return (
      <HaloShell
        className={shellClassName}
        invalid={isInvalid}
        translucent={translucent}
      >
        <div
          className={cn(
            "flex min-h-11 w-full items-center gap-2 px-3 py-2",
            CONTENT_RADIUS,
            innerRowClassName
          )}
        >
          {leadingSlot ? (
            <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
              {leadingSlot}
            </span>
          ) : null}
          <InputPrimitive
            aria-invalid={invalidFlag}
            className={cn(inputInnerClassName, className)}
            id={id}
            ref={ref}
            {...inputProps}
          />
          {trailingSlot ? (
            <span className="flex shrink-0 items-center text-muted-foreground [&_svg]:size-4">
              {trailingSlot}
            </span>
          ) : null}
        </div>
      </HaloShell>
    )
  }
)

export type HaloTextareaProps = Omit<ComponentProps<"textarea">, "size"> & {
  translucent?: boolean
  invalid?: boolean
  shellClassName?: string
  innerClassName?: string
}

/**
 * Multiline control with the same shell as {@link HaloInput} (no Paper shader / stagger).
 */
export const HaloTextarea = forwardRef<HTMLTextAreaElement, HaloTextareaProps>(
  function HaloTextarea(
    {
      className,
      translucent = true,
      invalid,
      shellClassName,
      innerClassName,
      id: idProp,
      rows = 4,
      "aria-invalid": ariaInvalid,
      ...textareaProps
    },
    ref
  ) {
    const uid = useId()
    const id = idProp ?? uid
    const isInvalid =
      Boolean(invalid) || ariaInvalid === true || ariaInvalid === "true"
    const invalidFlag = isInvalid || undefined

    return (
      <HaloShell
        className={shellClassName}
        innerClassName={innerClassName}
        invalid={isInvalid}
        translucent={translucent}
      >
        <div className={cn("px-3 py-2", CONTENT_RADIUS)}>
          <textarea
            aria-invalid={invalidFlag}
            className={cn(
              inputInnerClassName,
              "field-sizing-content min-h-[5.5rem] resize-y",
              "focus-visible:ring-0",
              className
            )}
            data-slot="animated-textarea"
            id={id}
            ref={ref}
            rows={rows}
            {...textareaProps}
          />
        </div>
      </HaloShell>
    )
  }
)

HaloInput.displayName = "HaloInput"
HaloTextarea.displayName = "HaloTextarea"
