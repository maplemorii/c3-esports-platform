"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Swords,
  GitBranch,
  BarChart2,
  AlertTriangle,
  UserCog,
  ClipboardList,
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
import type { Role } from "@/lib/roles"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin",              label: "Overview",   icon: LayoutDashboard },
  { href: "/admin/seasons",      label: "Seasons",    icon: Calendar },
  { href: "/admin/teams",        label: "Teams",      icon: Users },
  { href: "/admin/matches",      label: "Matches",    icon: Swords },
  { href: "/admin/brackets",     label: "Brackets",   icon: GitBranch },
  { href: "/admin/standings",    label: "Standings",  icon: BarChart2 },
  { href: "/admin/disputes",     label: "Disputes",   icon: AlertTriangle },
  { href: "/admin/users",        label: "Users",      icon: UserCog,       adminOnly: true },
  { href: "/admin/audit",        label: "Audit Log",  icon: ClipboardList, adminOnly: true },
]

// ---------------------------------------------------------------------------
// Shared nav list
// ---------------------------------------------------------------------------
function AdminNavItems({
  role,
  onNavigate,
}: {
  role: Role
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const isAdmin = role === "ADMIN"

  return (
    <nav className="flex flex-col gap-1 p-3">
      {NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map(
        ({ href, label, icon: Icon }) => {
          // Exact match for overview, prefix match for everything else
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        }
      )}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Desktop admin sidebar
// ---------------------------------------------------------------------------
export function AdminSidebar({ role }: { role: Role }) {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border bg-sidebar min-h-full">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <span className="font-display text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          {role === "ADMIN" ? "Admin Panel" : "Staff Panel"}
        </span>
      </div>
      <AdminNavItems role={role} />
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Mobile admin sidebar
// ---------------------------------------------------------------------------
export function MobileAdminSidebarTrigger({ role }: { role: Role }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open admin navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-56 p-0 bg-sidebar border-sidebar-border">
        <SheetTitle className="flex h-14 items-center px-4 border-b border-sidebar-border font-display text-sm font-semibold uppercase tracking-wider text-sidebar-foreground/60">
          {role === "ADMIN" ? "Admin Panel" : "Staff Panel"}
        </SheetTitle>
        <AdminNavItems role={role} />
      </SheetContent>
    </Sheet>
  )
}
