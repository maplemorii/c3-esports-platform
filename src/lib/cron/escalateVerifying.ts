/**
 * escalateVerifying.ts
 *
 * Escalates matches stuck in VERIFYING state to DISPUTED when the
 * result window has expired without confirmation from the opposing team.
 *
 * Called by matchTick as step 4.
 */

import { prisma } from "@/lib/prisma"
import { transitionTo } from "@/lib/services/matchStatus.service"
import { VERIFYING_STALE_AFTER_MS } from "@/lib/constants"

/**
 * Finds all VERIFYING matches whose submittedAt is older than VERIFYING_STALE_AFTER_MS
 * and transitions them to DISPUTED, writing an AuditLog entry for each.
 *
 * @returns Number of matches escalated.
 */
export async function escalateStaleVerifyingMatches(): Promise<number> {
  const cutoff = new Date(Date.now() - VERIFYING_STALE_AFTER_MS)

  const stale = await prisma.match.findMany({
    where: {
      status:      "VERIFYING",
      submittedAt: { lt: cutoff },
      deletedAt:   null,
    },
    select: { id: true },
  })

  let escalated = 0

  for (const { id } of stale) {
    try {
      await transitionTo(
        id,
        "DISPUTED",
        "system",
        "Automatically escalated: opposing team did not confirm scores within the result window."
      )
      escalated++
    } catch (err) {
      // Log but do not abort processing remaining matches
      console.error(`[escalateVerifying] Failed to escalate match ${id}:`, err)
    }
  }

  return escalated
}
