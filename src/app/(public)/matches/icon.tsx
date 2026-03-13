import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// Red → blue split circle — matches / versus
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
      {/* Outer ring */}
      <div
        style={{
          width: 22, height: 22,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #c41c35 0%, #c41c35 49%, #3b82f6 51%, #3b82f6 100%)",
          boxShadow: "0 0 10px rgba(196,28,53,0.5), 0 0 10px rgba(59,130,246,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Inner dark circle cutout */}
        <div
          style={{
            width: 10, height: 10,
            borderRadius: "50%",
            background: "#050814",
          }}
        />
      </div>
    </div>,
    { ...size },
  )
}
