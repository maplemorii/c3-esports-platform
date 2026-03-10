/**
 * GET /api/edu-verify/confirm?token=<rawToken>
 * Public — the user clicks this link from their email.
 * On success, redirects to /profile/edit?edu=verified.
 * On failure, redirects to /profile/edit?edu=error&reason=<reason>.
 */
import { NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawToken = searchParams.get("token")

  const redirectBase =
    (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000") + "/profile/edit"

  if (!rawToken) {
    return NextResponse.redirect(`${redirectBase}?edu=error&reason=missing_token`)
  }

  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")

  const user = await prisma.user.findFirst({
    where: {
      eduVerifyToken: hashedToken,
      deletedAt: null,
    },
    select: {
      id: true,
      eduVerifyExpires: true,
      eduEmailVerified: true,
    },
  })

  if (!user) {
    return NextResponse.redirect(`${redirectBase}?edu=error&reason=invalid_token`)
  }

  if (user.eduEmailVerified) {
    // Already verified — idempotent success
    return NextResponse.redirect(`${redirectBase}?edu=verified`)
  }

  if (!user.eduVerifyExpires || user.eduVerifyExpires < new Date()) {
    return NextResponse.redirect(`${redirectBase}?edu=error&reason=expired`)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      eduEmailVerified: new Date(),
      eduVerifyToken: null,   // invalidate after use
      eduVerifyExpires: null,
    },
  })

  return NextResponse.redirect(`${redirectBase}?edu=verified`)
}
