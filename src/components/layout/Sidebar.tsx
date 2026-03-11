"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Swords,
  Trophy,
  User,
  Menu,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet"

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/team",       label: "My Teams",   icon: Users },
  { href: "/dashboard/matches", label: "Matches", icon: Swords },
  { href: "/standings",  label: "Standings",  icon: Trophy },
  { href: "/profile",    label: "Profile",    icon: User },
]

// ---------------------------------------------------------------------------
// Shared nav list — used in both desktop and mobile variants
// ---------------------------------------------------------------------------
function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand/10 text-brand"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {active && (
              <span
                className="absolute left-0 top-1 bottom-1 w-0.5 rounded-full"
                style={{ background: "linear-gradient(to bottom, rgba(196,28,53,0.9), rgba(59,130,246,0.7))" }}
                aria-hidden
              />
            )}
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Desktop sidebar — fixed left column, hidden below md
// ---------------------------------------------------------------------------
export function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar min-h-full">
      <div className="relative flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Dashboard
        </span>
        <div
          className="absolute bottom-0 left-4 w-8 h-px"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.6), rgba(59,130,246,0.3), transparent)" }}
          aria-hidden
        />
      </div>
      <NavItems />
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Mobile sidebar — Sheet triggered by hamburger button
// ---------------------------------------------------------------------------
export function MobileSidebarTrigger() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" />}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open navigation</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0 bg-sidebar border-sidebar-border">
        <SheetTitle className="flex h-14 items-center px-4 border-b border-sidebar-border font-display text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          Dashboard
        </SheetTitle>
        <NavItems />
      </SheetContent>
    </Sheet>
  )
}
