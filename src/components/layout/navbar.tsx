import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { UserMenu } from "./user-menu"

const NAV_LINKS = [
  { href: "/seasons", label: "Seasons" },
  { href: "/teams", label: "Teams" },
]

export async function Navbar() {
  const session = await getServerSession(authOptions)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center px-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-1 font-display text-xl font-bold uppercase tracking-wide shrink-0">
          <span className="text-brand">C3</span>
          <span className="text-foreground">Esports</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex ml-8 gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          {session ? (
            <UserMenu session={session} />
          ) : (
            <Link href="/auth/signin" className={cn(buttonVariants({ size: "sm" }))}>
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
