/**
 * /api/upload/presign
 *
 * POST — authenticated; generates a presigned PUT URL for direct client-side upload.
 *
 * Body: { filename: string, contentType: string, category: "logo" | "replay" | "avatar" }
 *
 * Response: { uploadUrl, fileKey, publicUrl }
 *   - uploadUrl  — PUT this URL with the file bytes (Content-Type must match)
 *   - fileKey    — Store this in the DB and pass back to the relevant API endpoint
 *   - publicUrl  — CDN URL available immediately after upload
 */

import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/session"
import {
  getPresignedUploadUrl,
  assertAllowedContentType,
} from "@/lib/upload/storage"
import { PresignUploadSchema } from "@/lib/validators/match.schema"
import { parseBody, handleServiceError } from "@/lib/utils/errors"

export async function POST(req: Request) {
  const { error } = await requireAuth()
  if (error) return error

  const { data, error: bodyError } = await parseBody(req, PresignUploadSchema)
  if (bodyError) return bodyError

  try {
    assertAllowedContentType(data.category, data.contentType)

    const result = await getPresignedUploadUrl(
      data.category,
      data.filename,
      data.contentType
    )

    return NextResponse.json(result)
  } catch (err) {
    return handleServiceError(err, "POST /upload/presign")
  }
}
