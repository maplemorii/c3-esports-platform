import { ImageResponse } from "next/og"

export const size        = { width: 32, height: 32 }
export const contentType = "image/png"

// Red shield — admin / staff panel
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
      {/* Shield outer */}
      <div
        style={{
          width: 20, height: 23,
          background: "linear-gradient(160deg, #f87171 0%, #c41c35 55%, #881020 100%)",
          borderRadius: "4px 4px 50% 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 10px rgba(196,28,53,0.75), 0 2px 4px rgba(0,0,0,0.6)",
        }}
      >
        {/* Inner highlight bar */}
        <div
          style={{
            width: 7,
            height: 9,
            background: "rgba(255,255,255,0.22)",
            borderRadius: "1px 1px 50% 50%",
            marginTop: -2,
          }}
        />
      </div>
    </div>,
    { ...size },
  )
}
