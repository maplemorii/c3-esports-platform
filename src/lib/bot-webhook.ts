/**
 * bot-webhook.ts
 *
 * Fire-and-forget outbound webhook sender for the Discord bot.
 * Signs each payload with HMAC-SHA256 so the bot can verify authenticity.
 *
 * Configure via env vars:
 *   BOT_WEBHOOK_URL    — full URL of the bot's /webhook endpoint
 *   BOT_WEBHOOK_SECRET — shared secret for HMAC signature
 *
 * If BOT_WEBHOOK_URL is not set, all calls are silently no-ops.
 * Failures are logged but never surface to the caller.
 */

import { createHmac } from "crypto"

export type WebhookEventType =
  | "match.checkin_opened"
  | "match.started"
  | "match.completed"
  | "match.forfeited"
  | "dispute.opened"
  | "dispute.resolved"
  | "registration.submitted"
  | "registration.approved"

export function sendBotWebhook(
  event: WebhookEventType,
  payload: Record<string, unknown>
): void {
  const url    = process.env.BOT_WEBHOOK_URL
  const secret = process.env.BOT_WEBHOOK_SECRET
  if (!url) return

  const body = JSON.stringify({ event, ...payload, timestamp: new Date().toISOString() })

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (secret) {
    headers["x-webhook-signature"] = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`
  }

  fetch(url, { method: "POST", headers, body })
    .catch((err) => console.error(`[bot-webhook] Failed to deliver ${event}:`, err))
}
