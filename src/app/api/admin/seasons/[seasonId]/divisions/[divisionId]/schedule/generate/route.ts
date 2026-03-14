/**
 * /api/admin/seasons/[seasonId]/divisions/[divisionId]/schedule/generate
 *
 * POST — generate or preview a schedule for the division
 *
 * Body: { mode?: "FULL_RR" | "PARTIAL_RR" | "DOUBLE_RR", preview?: boolean }
 * preview=true  → dry run, returns ScheduleResult without DB writes
 * preview=false → writes to DB; errors if scheduleGeneratedAt already set
 *
 * Auth: STAFF+
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { requireRole } from "@/lib/session"
import { generateDivisionSchedule } from "@/lib/services/schedule.service"

const GenerateSchema = z.object({
  mode: z.enum(["FULL_RR", "PARTIAL_RR", "DOUBLE_RR"]).default("FULL_RR"),
  preview: z.boolean().default(false),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ seasonId: string; divisionId: string }> }
) {
  const { error } = await requireRole("STAFF")
  if (error) return error

  const { divisionId } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = GenerateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    )
  }

  const { mode, preview } = parsed.data

  try {
    const result = await generateDivisionSchedule(divisionId, mode, preview)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    const status =
      message.includes("already generated") ||
      message.includes("at least 2") ||
      message.includes("not found")
        ? 400
        : 500
    return NextResponse.json({ error: message }, { status })
  }
}
