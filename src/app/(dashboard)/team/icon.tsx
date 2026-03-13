import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// Sky-blue people — team pages
export default function Icon() {
  return new ImageResponse(
    <div style={{ width: 32, height: 32, background: "#050814", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3 }}>
          <div style={{ width: 7, height: 7, background: "rgba(56,189,248,0.55)", borderRadius: "50%", marginBottom: 1 }} />
          <div style={{ width: 9, height: 9, background: "rgba(56,189,248,0.95)", borderRadius: "50%", boxShadow: "0 0 7px rgba(56,189,248,0.7)" }} />
          <div style={{ width: 7, height: 7, background: "rgba(56,189,248,0.55)", borderRadius: "50%", marginBottom: 1 }} />
        </div>
        <div style={{ width: 22, height: 6, background: "linear-gradient(90deg, rgba(56,189,248,0.25), rgba(56,189,248,0.7), rgba(56,189,248,0.25))", borderRadius: "3px 3px 0 0" }} />
      </div>
    </div>,
    { ...size },
  )
}
