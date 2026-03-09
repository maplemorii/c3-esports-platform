/**
 * /api/teams/:teamId/logo
 *
 * POST — team owner or STAFF+; generate a presigned S3/R2 PUT URL for a logo upload.
 *
 * Flow:
 *   1. Client POSTs { filename, contentType } to this endpoint.
 *   2. Server validates, generates a presigned PUT URL, and pre-writes the new
 *      logoUrl + logoKey to the team record (optimistic — avoids a second round-trip).
 *   3. Client uploads the file directly to the presigned URL (never hits our server).
 *   4. The team's logoUrl is already updated and will resolve once the upload completes.
 *
 * Response: { uploadUrl, fileKey, publicUrl }
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/session"
import { assertCanManageTeam } from "@/lib/auth/permissions"
import { TeamLogoPresignSchema } from "@/lib/validators/team.schema"
import {
  parseBody,
  apiNotFound,
  apiInternalError,
} from "@/lib/utils/errors"
import { getPresignedUploadUrl, deleteObject } from "@/lib/upload/storage"
import { PRESIGN_EXPIRES_SECONDS as EXPIRY } from "@/lib/constants"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params

  // Auth
  const { session, error: authError } = await requireAuth()
  if (authError) return authError

  // Permission: owner or STAFF+
  const denied = await assertCanManageTeam(session, teamId)
  if (denied) return denied

  // Validate body
  const { data, error: bodyError } = await parseBody(req, TeamLogoPresignSchema)
  if (bodyError) return bodyError

  try {
    // Team must exist
    const team = await prisma.team.findUnique({
      where:  { id: teamId, deletedAt: null },
      select: { id: true, logoKey: true },
    })
    if (!team) return apiNotFound("Team")

    // Generate presigned PUT URL
    const result = await getPresignedUploadUrl(
      "logo",
      data.filename,
      data.contentType,
      EXPIRY
    )

    // Optimistically update the team record with the new logo location.
    // If the upload fails the client simply retries — no stale keys accumulate
    // because we delete the previous key below.
    await prisma.team.update({
      where: { id: teamId },
      data:  { logoUrl: result.publicUrl, logoKey: result.fileKey },
    })

    // Clean up the old logo from storage (fire-and-forget — don't block the response)
    if (team.logoKey) {
      deleteObject(team.logoKey).catch((err) =>
        console.warn(`[logo] Failed to delete old logo key "${team.logoKey}":`, err)
      )
    }

    return NextResponse.json({
      uploadUrl: result.uploadUrl,
      fileKey:   result.fileKey,
      publicUrl: result.publicUrl,
    })
  } catch (err) {
    return apiInternalError(err, "POST /api/teams/:teamId/logo")
  }
}
