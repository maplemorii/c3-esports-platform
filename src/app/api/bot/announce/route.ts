/**
 * POST /api/bot/announce
 * Store a platform announcement posted by the Discord bot. Bot auth required.
 * (Actual Discord posting is handled by the bot itself — this just persists it.)
 */

import { type NextRequest, NextResponse } from "next/server"
import { requireBotAuth } from "@/lib/bot-auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const Schema = z.object({
  title:             z.string().min(1).max(100),
  body:              z.string().min(1).max(1000),
  postedByDiscordId: z.string().optional(),
  postedByName:      z.string().optional(),
})

export async function POST(req: NextRequest) {
  const authError = requireBotAuth(req)
  if (authError) return authError

  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 422 })

  const announcement = await prisma.announcement.create({
    data: {
      title:             parsed.data.title,
      body:              parsed.data.body,
      postedByDiscordId: parsed.data.postedByDiscordId,
      postedByName:      parsed.data.postedByName,
    },
  })

  return NextResponse.json({ ok: true, id: announcement.id }, { status: 201 })
}
