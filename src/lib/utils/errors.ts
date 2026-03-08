/**
 * errors.ts
 *
 * Typed API error response helpers for Route Handlers.
 *
 * Usage in a Route Handler:
 *   return apiError(400, "Team name is already taken")
 *   return apiError(404, "Season not found")
 *   return apiError(422, "Validation failed", { fields: zodError.flatten() })
 *   return apiInternalError(err)  // 500, redacts details in production
 *
 * All responses share the shape:
 *   { error: string, code?: string, details?: unknown }
 */

import { NextResponse } from "next/server"
import { ZodError } from "zod"

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  error: string
  code?: string
  details?: unknown
}

// ---------------------------------------------------------------------------
// Typed HTTP error responses
// ---------------------------------------------------------------------------

/** Generic API error. Returns a NextResponse with the given status code. */
export function apiError(
  status: number,
  message: string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, details }, { status })
}

/** 400 Bad Request */
export function apiBadRequest(
  message = "Bad request",
  details?: unknown
): NextResponse<ApiErrorBody> {
  return apiError(400, message, details)
}

/** 401 Unauthorized */
export function apiUnauthorized(
  message = "Unauthorized"
): NextResponse<ApiErrorBody> {
  return apiError(401, message)
}

/** 403 Forbidden */
export function apiForbidden(
  message = "Forbidden"
): NextResponse<ApiErrorBody> {
  return apiError(403, message)
}

/** 404 Not Found */
export function apiNotFound(
  resource = "Resource"
): NextResponse<ApiErrorBody> {
  return apiError(404, `${resource} not found`)
}

/** 409 Conflict */
export function apiConflict(
  message: string
): NextResponse<ApiErrorBody> {
  return apiError(409, message)
}

/** 422 Unprocessable Entity — Zod validation failure */
export function apiValidationError(
  err: ZodError
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: err.flatten(),
    },
    { status: 422 }
  )
}

/**
 * 500 Internal Server Error.
 * Logs the real error server-side; sends a safe message to the client.
 */
export function apiInternalError(
  err: unknown,
  context?: string
): NextResponse<ApiErrorBody> {
  const label = context ? `[${context}]` : "[API]"
  console.error(`${label} Internal error:`, err)

  const message =
    process.env.NODE_ENV === "development" && err instanceof Error
      ? err.message
      : "An unexpected error occurred"

  return apiError(500, message)
}

// ---------------------------------------------------------------------------
// Parse + validate helper
// ---------------------------------------------------------------------------

/**
 * Parses a Request body as JSON and validates it against a Zod schema.
 * Returns { data } on success or { error: NextResponse } on failure.
 *
 * Usage:
 *   const { data, error } = await parseBody(req, CreateTeamSchema)
 *   if (error) return error
 *   // data is fully typed
 *
 * @param req    The incoming Next.js Request
 * @param schema Any Zod schema with a .safeParse() method
 */
export async function parseBody<T>(
  req: Request,
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: ZodError } }
): Promise<{ data: T; error: null } | { data: null; error: NextResponse<ApiErrorBody> }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { data: null, error: apiBadRequest("Request body must be valid JSON") }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: apiValidationError(result.error) }
  }

  return { data: result.data, error: null }
}

// ---------------------------------------------------------------------------
// Domain error classes
// ---------------------------------------------------------------------------

/** Thrown when a requested resource does not exist. */
export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} '${id}' not found` : `${resource} not found`)
    this.name = "NotFoundError"
  }
}

/** Thrown when a business rule is violated (invalid state, duplicate, etc.). */
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = "DomainError"
  }
}

/**
 * Converts a known domain error into the appropriate API error response.
 * Falls back to apiInternalError for unexpected errors.
 *
 * Usage at the top of a catch block:
 *   } catch (err) {
 *     return handleServiceError(err, "createTeam")
 *   }
 */
export function handleServiceError(
  err: unknown,
  context?: string
): NextResponse<ApiErrorBody> {
  if (err instanceof NotFoundError) return apiNotFound(err.message)
  if (err instanceof DomainError)   return apiConflict(err.message)
  return apiInternalError(err, context)
}
