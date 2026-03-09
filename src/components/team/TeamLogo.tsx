/**
 * TeamLogo
 *
 * Displays a team's logo image, or falls back to a colored square with
 * the team's initials if no logo URL is set.
 *
 * Usage:
 *   <TeamLogo name="Carolina Chaos" logoUrl={null} primaryColor="#C0273A" size="md" />
 */

import { cn } from "@/lib/utils"

type Size = "xs" | "sm" | "md" | "lg" | "xl"

const SIZE_MAP: Record<Size, { container: string; text: string }> = {
  xs: { container: "h-7 w-7 rounded-md text-[10px]",  text: "" },
  sm: { container: "h-10 w-10 rounded-lg text-xs",     text: "" },
  md: { container: "h-12 w-12 rounded-lg text-sm",     text: "" },
  lg: { container: "h-16 w-16 rounded-xl text-xl",     text: "" },
  xl: { container: "h-20 w-20 rounded-xl text-2xl",    text: "" },
}

interface TeamLogoProps {
  name:          string
  logoUrl?:      string | null
  primaryColor?: string | null
  size?:         Size
  className?:    string
}

export function TeamLogo({
  name,
  logoUrl,
  primaryColor,
  size = "md",
  className,
}: TeamLogoProps) {
  const color    = primaryColor ?? "oklch(0.50 0.20 15)"
  const initials = name.slice(0, 2).toUpperCase()
  const { container } = SIZE_MAP[size]

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border border-border font-bold text-white",
        container,
        className
      )}
      style={{ backgroundColor: color }}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="h-full w-full object-cover"
          style={{ borderRadius: "inherit" }}
        />
      ) : (
        initials
      )}
    </div>
  )
}
