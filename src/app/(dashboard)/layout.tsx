/**
 * Dashboard layout — /(dashboard)/*
 *
 * Auth gate: redirects to sign-in if unauthenticated.
 * Wraps all authenticated dashboard pages in DashboardShell, which renders
 * the user sidebar (or AdminSidebar for STAFF/ADMIN roles).
 */

import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { DashboardShell } from "@/components/layout/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  return (
    <DashboardShell role={session.user.role}>
      {children}
    </DashboardShell>
  )
}
