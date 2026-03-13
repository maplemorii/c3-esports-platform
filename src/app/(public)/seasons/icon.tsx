import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// Amber trophy — seasons
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
        {/* Cup body */}
        <div
          style={{
            width: 18, height: 13,
            background: "linear-gradient(160deg, #fcd34d 0%, #f59e0b 60%, #b45309 100%)",
            borderRadius: "2px 2px 9px 9px",
            boxShadow: "0 0 10px rgba(245,158,11,0.65)",
          }}
        />
        {/* Stem */}
        <div
          style={{
            width: 4, height: 4,
            background: "#d97706",
          }}
        />
        {/* Base */}
        <div
          style={{
            width: 14, height: 3,
            background: "linear-gradient(90deg, #b45309, #f59e0b, #b45309)",
            borderRadius: 2,
          }}
        />
      </div>
    </div>,
    { ...size },
  )
}
