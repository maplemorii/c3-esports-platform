import { Sidebar, MobileSidebarTrigger } from "./Sidebar"
import { AdminSidebar, MobileAdminSidebarTrigger } from "./AdminSidebar"
import { hasMinRole } from "@/lib/roles"
import type { Role } from "@/lib/roles"

interface DashboardShellProps {
  children: React.ReactNode
  role: Role
  /** Page title shown in the top bar on mobile */
  heading?: string
}

/**
 * Persistent layout shell used by all authenticated route groups.
 *
 * - STAFF / ADMIN  → AdminSidebar (with role-gated items)
 * - Everyone else  → Sidebar (dashboard, teams, matches, profile)
 *
 * The shell does NOT include <Navbar> or <Footer>; those live in the root
 * layout. Dashboard route groups use their own layout.tsx that wraps
 * children with this shell.
 *
 * Usage in a route group layout:
 *   import { DashboardShell } from "@/components/layout/DashboardShell"
 *   import { getSession } from "@/lib/session"
 *   import { redirect } from "next/navigation"
 *
 *   export default async function Layout({ children }) {
 *     const session = await getSession()
 *     if (!session) redirect("/auth/signin")
 *     return <DashboardShell role={session.user.role}>{children}</DashboardShell>
 *   }
 */
export function DashboardShell({ children, role, heading }: DashboardShellProps) {
  const isStaff = hasMinRole(role, "STAFF")

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      {isStaff ? <AdminSidebar role={role} /> : <Sidebar />}

      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="relative flex h-14 items-center gap-3 border-b border-border px-4 md:hidden">
          {/* Red→blue accent line at bottom of mobile bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
            style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.35), transparent)" }}
            aria-hidden
          />
          {isStaff ? (
            <MobileAdminSidebarTrigger role={role} />
          ) : (
            <MobileSidebarTrigger />
          )}
          {heading && (
            <h1 className="font-display text-base font-semibold uppercase tracking-wide truncate">
              {heading}
            </h1>
          )}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
