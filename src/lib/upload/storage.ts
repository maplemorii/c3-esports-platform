/**
 * storage.ts
 *
 * S3-compatible file storage helper.
 * Works with both AWS S3 and Cloudflare R2 (R2 has an S3-compatible API).
 *
 * Environment variables (see .env.example):
 *   STORAGE_ENDPOINT        — R2: https://<account-id>.r2.cloudflarestorage.com
 *                             S3: omit (uses regional endpoint automatically)
 *   STORAGE_REGION          — R2: "auto" | S3: "us-east-1" etc.
 *   STORAGE_ACCESS_KEY_ID
 *   STORAGE_SECRET_ACCESS_KEY
 *   STORAGE_BUCKET_NAME
 *   STORAGE_PUBLIC_URL      — CDN base URL for public file reads
 *
 * Usage:
 *   // Generate a presigned PUT URL for client-side upload
 *   const { uploadUrl, fileKey } = await getPresignedUploadUrl("replay", "game.replay")
 *
 *   // Get the public CDN URL for a stored file
 *   const url = getPublicUrl("logos/team-alpha-k3f2.png")
 *
 *   // Stream a file (for ballchasing.com submission)
 *   const stream = await getObjectStream("replays/match-abc123-game1.replay")
 */

import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"
import path from "path"

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

function createS3Client(): S3Client {
  const region   = process.env.STORAGE_REGION    ?? "auto"
  const endpoint = process.env.STORAGE_ENDPOINT  // undefined = use AWS default

  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: false } : {}),
    credentials: {
      accessKeyId:     process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
  })
}

// Reuse the client across invocations in the same Node.js process
const globalForS3 = global as unknown as { s3: S3Client }
export const s3 = globalForS3.s3 ?? createS3Client()
if (process.env.NODE_ENV !== "production") globalForS3.s3 = s3

const BUCKET = process.env.STORAGE_BUCKET_NAME ?? ""

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UploadCategory = "logo" | "replay" | "avatar"

export interface PresignedUploadResult {
  /** The presigned PUT URL — send the file directly to this from the browser. */
  uploadUrl: string
  /** The S3/R2 object key — store this in the DB and use it to build public URLs. */
  fileKey: string
  /** Public CDN URL — immediately usable after the upload completes. */
  publicUrl: string
}

// ---------------------------------------------------------------------------
// Presigned uploads
// ---------------------------------------------------------------------------

/**
 * Generates a presigned PUT URL for a direct client-side upload to S3/R2.
 * The client uploads the file directly — it never passes through the Next.js server.
 *
 * @param category    Determines the storage path prefix ("logo", "replay", "avatar")
 * @param filename    Original filename (used for extension detection only)
 * @param contentType MIME type of the file being uploaded
 * @param expiresIn   Seconds until the presigned URL expires (default: 300)
 */
export async function getPresignedUploadUrl(
  category: UploadCategory,
  filename: string,
  contentType: string,
  expiresIn = 300
): Promise<PresignedUploadResult> {
  const ext = path.extname(filename).toLowerCase()
  const fileKey = buildFileKey(category, ext)

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         fileKey,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn })

  return {
    uploadUrl,
    fileKey,
    publicUrl: getPublicUrl(fileKey),
  }
}

// ---------------------------------------------------------------------------
// Public URLs
// ---------------------------------------------------------------------------

/**
 * Returns the public CDN URL for a stored object.
 * Uses STORAGE_PUBLIC_URL as the base (set to your R2 custom domain or CloudFront URL).
 */
export function getPublicUrl(fileKey: string): string {
  const base = process.env.STORAGE_PUBLIC_URL?.replace(/\/$/, "") ?? ""
  return `${base}/${fileKey}`
}

// ---------------------------------------------------------------------------
// Server-side object access (used by ballchasing.service.ts)
// ---------------------------------------------------------------------------

/**
 * Returns the S3 GetObject response for a file key.
 * Use `.Body` (a `Readable`) to stream the file to an external API.
 */
export async function getObject(fileKey: string): Promise<GetObjectCommandOutput> {
  return s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: fileKey })
  )
}

/**
 * Deletes an object from the bucket.
 * Called when a replay upload is removed or a team logo is replaced.
 */
export async function deleteObject(fileKey: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: fileKey })
  )
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Allowed MIME types per upload category. */
const ALLOWED_TYPES: Record<UploadCategory, string[]> = {
  logo:   ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  replay: ["application/octet-stream", "application/x-replay"],
  avatar: ["image/jpeg", "image/png", "image/webp"],
}

/**
 * Validates that a content type is permitted for the given category.
 * Throws a descriptive error if not allowed.
 */
export function assertAllowedContentType(
  category: UploadCategory,
  contentType: string
): void {
  const allowed = ALLOWED_TYPES[category]
  // Replays can have any binary content type since clients may send different values
  if (category === "replay") return
  if (!allowed.includes(contentType)) {
    throw new Error(
      `Content type "${contentType}" is not allowed for category "${category}". ` +
      `Allowed: ${allowed.join(", ")}`
    )
  }
}

/**
 * Constructs the S3 object key for a new upload.
 * Format: {category}s/{uuid}{ext}
 *
 * @example
 * buildFileKey("logo", ".png")   → "logos/3f2a1b4c-....png"
 * buildFileKey("replay", "")     → "replays/3f2a1b4c-..."
 */
function buildFileKey(category: UploadCategory, ext: string): string {
  const prefix = `${category}s`
  const id = randomUUID()
  return `${prefix}/${id}${ext}`
}
