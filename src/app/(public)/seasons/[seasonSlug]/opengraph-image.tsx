import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"
import type { SeasonStatus } from "@prisma/client"

export const runtime = "nodejs"
export const alt = "Season Overview — C3 Esports League"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const STATUS_LABEL: Record<SeasonStatus, string> = {
  DRAFT:        "Draft",
  REGISTRATION: "Registration Open",
  ACTIVE:       "Regular Season",
  PLAYOFFS:     "Playoffs",
  COMPLETED:    "Completed",
  CANCELLED:    "Cancelled",
}

const STATUS_COLOR: Record<SeasonStatus, string> = {
  DRAFT:        "#64748b",
  REGISTRATION: "#38bdf8",
  ACTIVE:       "#e11d48",
  PLAYOFFS:     "#f59e0b",
  COMPLETED:    "#94a3b8",
  CANCELLED:    "#ef4444",
}

export default async function Image({
  params,
}: {
  params: Promise<{ seasonSlug: string }>
}) {
  const { seasonSlug } = await params
  const season = await prisma.season.findFirst({
    where:  { slug: seasonSlug, isVisible: true },
    select: { name: true, status: true, description: true },
  })

  const name   = season?.name ?? "Season"
  const status = season?.status ?? "ACTIVE"
  const label  = STATUS_LABEL[status]
  const color  = STATUS_COLOR[status]

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
        {/* Background radial */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -100,
            width: 700,
            height: 700,
            background: `radial-gradient(circle, ${color}18 0%, transparent 65%)`,
          }}
        />

        {/* Eyebrow */}
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
          Carolina Collegiate Clash
        </div>

        {/* Season name */}
        <div
          style={{
            fontSize: name.length > 22 ? 56 : name.length > 16 ? 68 : 80,
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

        {/* Status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginTop: "auto",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: color,
            }}
          />
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: color,
              letterSpacing: 1,
            }}
          >
            {label}
          </span>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${color}, transparent)`,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
