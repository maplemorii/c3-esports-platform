/**
 * logger.ts
 *
 * Pino logger singleton for server-side use only.
 * Pretty-prints in development; outputs JSON in production.
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   logger.info({ userId }, "User registered")
 *   logger.error({ err, path }, "Request failed")
 *
 * Request logging helper:
 *   import { logRequest } from "@/lib/logger"
 *   logRequest(req, 200, startMs)
 */

import pino from "pino"

const isDev = process.env.NODE_ENV !== "production"

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

function createLogger() {
  return pino({
    level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
    ...(isDev
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize:        true,
              translateTime:   "HH:MM:ss",
              ignore:          "pid,hostname",
              messageFormat:   "{msg}",
            },
          },
        }
      : {}),
  })
}

const globalForLogger = global as unknown as { _pinoLogger?: pino.Logger }
export const logger: pino.Logger =
  globalForLogger._pinoLogger ?? createLogger()

if (isDev) globalForLogger._pinoLogger = logger

// ---------------------------------------------------------------------------
// Request logging helper
// ---------------------------------------------------------------------------

/**
 * Log an incoming API request with method, path, status, and duration.
 * Call at the END of a route handler once you know the status code.
 *
 * @example
 * const t = Date.now()
 * // ... handler logic ...
 * logRequest(req, 200, t)
 */
export function logRequest(
  req: Request,
  status: number,
  startMs: number,
  extra?: Record<string, unknown>
) {
  const url      = new URL(req.url)
  const duration = Date.now() - startMs
  const level    = status >= 500 ? "error" : status >= 400 ? "warn" : "info"

  logger[level]({
    method:   req.method,
    path:     url.pathname,
    status,
    duration: `${duration}ms`,
    ...extra,
  }, `${req.method} ${url.pathname} ${status}`)
}
