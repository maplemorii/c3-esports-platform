import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// Blue 2×2 grid — dashboard / team pages
export default function Icon() {
  const tile = (color: string) => (
    <div
      style={{
        width: 12, height: 12,
        background: color,
        borderRadius: 3,
      }}
    />
  )

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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <div style={{ display: "flex", gap: 3 }}>
          {tile("rgba(96,165,250,0.95)")}
          {tile("rgba(59,130,246,0.65)")}
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {tile("rgba(59,130,246,0.65)")}
          {tile("rgba(96,165,250,0.95)")}
        </div>
      </div>
    </div>,
    { ...size },
  )
}
