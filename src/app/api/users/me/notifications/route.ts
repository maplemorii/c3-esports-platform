/**
 * /api/users/me/notifications
 *
 * PATCH — authenticated; update the current user's email notification preferences.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { parseBody, handleServiceError } from "@/lib/utils/errors"

const NotificationPrefsSchema = z.object({
  emailNotifResults:  z.boolean().optional(),
  emailNotifDisputes: z.boolean().optional(),
  emailNotifReplays:  z.boolean().optional(),
})

export async function PATCH(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { data, error: bodyError } = await parseBody(req, NotificationPrefsSchema)
  if (bodyError) return bodyError

  try {
    const updated = await prisma.user.update({
      where:  { id: session.user.id },
      data,
      select: {
        emailNotifResults:  true,
        emailNotifDisputes: true,
        emailNotifReplays:  true,
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    return handleServiceError(err, "PATCH /users/me/notifications")
  }
}
