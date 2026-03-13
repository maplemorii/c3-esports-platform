import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// Sky-blue person + two flanking dots — teams
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32, height: 32,
        background: "#050814",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        {/* Heads row */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
          {/* Left flanking head */}
          <div
            style={{
              width: 7, height: 7,
              background: "rgba(56,189,248,0.55)",
              borderRadius: "50%",
              marginBottom: 1,
            }}
          />
          {/* Centre head */}
          <div
            style={{
              width: 9, height: 9,
              background: "rgba(56,189,248,0.95)",
              borderRadius: "50%",
              boxShadow: "0 0 7px rgba(56,189,248,0.7)",
            }}
          />
          {/* Right flanking head */}
          <div
            style={{
              width: 7, height: 7,
              background: "rgba(56,189,248,0.55)",
              borderRadius: "50%",
              marginBottom: 1,
            }}
          />
        </div>
        {/* Shoulder bar */}
        <div
          style={{
            width: 22, height: 6,
            background: "linear-gradient(90deg, rgba(56,189,248,0.25), rgba(56,189,248,0.7), rgba(56,189,248,0.25))",
            borderRadius: "3px 3px 0 0",
          }}
        />
      </div>
    </div>,
    { ...size },
  )
}
