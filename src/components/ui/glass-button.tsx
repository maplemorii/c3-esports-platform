import * as React from "react"
import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  "relative isolate all-unset cursor-pointer rounded-full transition-all",
  {
    variants: {
      size: {
        default: "text-base font-medium",
        sm:      "text-sm font-medium",
        lg:      "text-lg font-medium",
        icon:    "h-10 w-10",
      },
    },
    defaultVariants: { size: "default" },
  }
)

const glassButtonTextVariants = cva(
  "glass-button-text relative block select-none tracking-tighter",
  {
    variants: {
      size: {
        default: "px-6 py-3.5",
        sm:      "px-4 py-2",
        lg:      "px-8 py-4",
        icon:    "flex h-10 w-10 items-center justify-center",
      },
    },
    defaultVariants: { size: "default" },
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  contentClassName?: string
  href?: string
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, children, size, contentClassName, href, ...props }, ref) => {
    const inner = (
      <>
        <button
          className={cn("glass-button", glassButtonVariants({ size }))}
          ref={ref}
          {...(href ? {} : props)}
        >
          <span className={cn(glassButtonTextVariants({ size }), contentClassName)}>
            {children}
          </span>
        </button>
        <div className="glass-button-shadow rounded-full" />
      </>
    )

    if (href) {
      return (
        <Link
          href={href}
          className={cn("glass-button-wrap cursor-pointer rounded-full", className)}
        >
          {inner}
        </Link>
      )
    }

    return (
      <div className={cn("glass-button-wrap cursor-pointer rounded-full", className)}>
        {inner}
      </div>
    )
  }
)
GlassButton.displayName = "GlassButton"

export { GlassButton, glassButtonVariants }
