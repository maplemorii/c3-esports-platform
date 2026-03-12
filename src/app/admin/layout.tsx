/**
 * Admin layout — /admin/*
 *
 * Auth gate: redirects to sign-in if unauthenticated.
 * Role gate: redirects to /dashboard if the user is below STAFF.
 * Wraps all admin pages in DashboardShell, which renders AdminSidebar
 * for STAFF and ADMIN roles.
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
