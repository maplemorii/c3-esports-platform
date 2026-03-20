const SCHOOLS = [
  "NC State",
  "UNC Chapel Hill",
  "Clemson",
  "ECU",
  "App State",
  "UNC Charlotte",
  "Wake Forest",
  "Winthrop",
  "High Point",
  "USC",
]

const GAME_TITLES = [
  "Rocket League",
  "Valorant",
  "Overwatch 2",
]

const DOUBLED_SCHOOLS = [...SCHOOLS, ...SCHOOLS]
const DOUBLED_GAMES = [...GAME_TITLES, ...GAME_TITLES]

export function MarqueeSection() {
  return (
    <div
      className="relative overflow-hidden py-5"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
      aria-label="Participating universities and supported game titles"
    >
      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 h-full w-28 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, oklch(0.09 0.015 260), transparent)",
        }}
        aria-hidden
      />
      <div
        className="absolute right-0 top-0 h-full w-28 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, oklch(0.09 0.015 260), transparent)",
        }}
        aria-hidden
      />

      {/* Row 1: Schools */}
      <div className="marquee-track mb-3" aria-hidden>
        {DOUBLED_SCHOOLS.map((school, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span
              className="font-sans text-[11px] font-medium uppercase tracking-[0.20em] whitespace-nowrap px-7"
              style={{ color: "rgba(255,255,255,0.28)" }}
            >
              {school}
            </span>
            <span
              className="block h-1 w-1 rounded-full shrink-0"
              style={{ background: "rgba(255,255,255,0.06)" }}
            />
          </div>
        ))}
      </div>

      {/* Row 2: Games (reversed) */}
      <div
        className="marquee-track"
        style={{ animationDirection: "reverse", animationDuration: "24s" }}
        aria-hidden
      >
        {DOUBLED_GAMES.map((game, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span
              className="font-sans text-[11px] font-medium uppercase tracking-[0.20em] whitespace-nowrap px-7"
              style={{ color: "rgba(180,60,60,0.45)" }}
            >
              {game}
            </span>
            <span
              className="block h-1 w-1 rounded-full shrink-0"
              style={{ background: "rgba(180,60,60,0.10)" }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
