import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "C3 Esports League — Collegiate Rocket League in the Carolinas"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0c1220",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(225,29,72,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(225,29,72,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: "50%",
            transform: "translateX(-50%)",
            width: 800,
            height: 400,
            background: "radial-gradient(circle, rgba(225,29,72,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 8,
              color: "#e11d48",
              textTransform: "uppercase",
            }}
          >
            Carolina Collegiate Clash
          </div>
          <div
            style={{
              fontSize: 90,
              fontWeight: 900,
              color: "#f8fafc",
              letterSpacing: -4,
              lineHeight: 1,
              textTransform: "uppercase",
            }}
          >
            C3 Esports
          </div>
          <div
            style={{
              fontSize: 22,
              color: "#94a3b8",
              letterSpacing: 2,
            }}
          >
            Rocket League · Collegiate · Carolinas
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #e11d48, #be123c)",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
