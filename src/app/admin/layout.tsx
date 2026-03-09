/**
 * Admin layout
 *
 * Wraps all /admin/* pages with authentication + the DashboardShell
 * (which renders AdminSidebar for STAFF/ADMIN roles).
 * Redirects to signin if unauthenticated; 403 page if insufficient role.
 */

import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { hasMinRole } from "@/lib/roles"
import { DashboardShell } from "@/components/layout/DashboardShell"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/auth/signin")
  if (!hasMinRole(session.user.role, "STAFF")) redirect("/dashboard")

  return (
    <DashboardShell role={session.user.role}>
      {children}
    </DashboardShell>
  )
}
