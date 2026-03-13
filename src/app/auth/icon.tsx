import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// White lock — auth / sign-in
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
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* Shackle arc (top half of a circle outline) */}
        <div
          style={{
            width: 12, height: 7,
            border: "2.5px solid rgba(255,255,255,0.7)",
            borderBottom: "none",
            borderRadius: "6px 6px 0 0",
          }}
        />
        {/* Lock body */}
        <div
          style={{
            width: 18, height: 12,
            background: "rgba(255,255,255,0.75)",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 4, height: 5,
              background: "#050814",
              borderRadius: "0 0 2px 2px",
              marginTop: 2,
            }}
          />
        </div>
      </div>
    </div>,
    { ...size },
  )
}
