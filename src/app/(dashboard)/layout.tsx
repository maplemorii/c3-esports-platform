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
    select: { emailVerified: true, name: true, image: true },
  })

  return (
    <DashboardShell
      role={session.user.role}
      userName={dbUser?.name ?? session.user.name ?? "User"}
      userImage={dbUser?.image ?? session.user.image}
    >
      <Suspense>
        <EmailVerificationBanner emailVerified={!!dbUser?.emailVerified} />
      </Suspense>
      {children}
    </DashboardShell>
  )
}
