const SCHOOLS = [
  "NC State",
  "UNC Chapel Hill",
  "Duke",
  "Clemson",
  "ECU",
  "App State",
  "UNC Charlotte",
  "Wake Forest",
  "Winthrop",
  "High Point",
  "Elon",
  "Campbell",
  "Queens",
  "Gardner-Webb",
  "Catawba",
  "Wingate",
]

/* Duplicate for seamless infinite loop */
const DOUBLED = [...SCHOOLS, ...SCHOOLS]

export function MarqueeSection() {
  return (
    <div
      className="relative overflow-hidden py-5"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.015)",
      }}
      aria-label="Participating universities"
    >
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, oklch(0.07 0.02 265), transparent)",
        }}
        aria-hidden
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, oklch(0.07 0.02 265), transparent)",
        }}
        aria-hidden
      />

      <div className="marquee-track" aria-hidden>
        {DOUBLED.map((school, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span
              className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] whitespace-nowrap px-6"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              {school}
            </span>
            <span style={{ color: "rgba(255,255,255,0.08)", fontSize: "8px" }}>◆</span>
          </div>
        ))}
      </div>
    </div>
  )
}
