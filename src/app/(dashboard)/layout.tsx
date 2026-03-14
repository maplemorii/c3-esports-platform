/**
 * Dashboard layout — /(dashboard)/*
 *
 * Auth gate: redirects to sign-in if unauthenticated.
 * Wraps all authenticated dashboard pages in DashboardShell, which renders
 * the user sidebar (or AdminSidebar for STAFF/ADMIN roles).
 * Shows an email verification banner until the user's email is confirmed.
 */

import { redirect } from "next/navigation"
import { Suspense } from "react"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/layout/DashboardShell"
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/auth/signin")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  })

  const emailVerified = !!dbUser?.emailVerified

  return (
    <DashboardShell role={session.user.role}>
      <Suspense>
        <EmailVerificationBanner emailVerified={emailVerified} />
      </Suspense>
      {children}
    </DashboardShell>
  )
}
