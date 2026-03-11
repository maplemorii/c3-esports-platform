import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const alt = "Team Profile — C3 Esports League"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({
  params,
}: {
  params: Promise<{ teamSlug: string }>
}) {
  const { teamSlug } = await params
  const team = await prisma.team.findUnique({
    where:  { slug: teamSlug, deletedAt: null },
    select: { name: true, primaryColor: true, secondaryColor: true },
  })

  const name    = team?.name ?? "Team"
  const accent  = team?.primaryColor ?? "#e11d48"
  const accent2 = team?.secondaryColor ?? accent

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c1220",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow using team colors */}
        <div
          style={{
            position: "absolute",
            bottom: -150,
            right: -150,
            width: 600,
            height: 600,
            background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
          }}
        />

        {/* Top accent bar */}
        <div
          style={{
            width: 80,
            height: 6,
            background: `linear-gradient(90deg, ${accent}, ${accent2})`,
            borderRadius: 3,
            marginBottom: 48,
          }}
        />

        {/* Label */}
        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: 5,
            color: "#64748b",
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Team Profile · C3 Esports League
        </div>

        {/* Team name */}
        <div
          style={{
            fontSize: name.length > 20 ? 60 : name.length > 14 ? 72 : 88,
            fontWeight: 900,
            color: "#f8fafc",
            textTransform: "uppercase",
            letterSpacing: -2,
            lineHeight: 1,
            flex: 1,
          }}
        >
          {name}
        </div>

        {/* Color swatches */}
        <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: accent,
              border: "2px solid rgba(255,255,255,0.15)",
            }}
          />
          {accent2 !== accent && (
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: accent2,
                border: "2px solid rgba(255,255,255,0.15)",
              }}
            />
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${accent}, ${accent2})`,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
