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

const GAME_TITLES = [
  "Rocket League",
  "Valorant",
  "Marvel Rivals",
  "Overwatch 2",
  "Counter-Strike 2",
  "Apex Legends",
  "Rainbow Six Siege",
  "Super Smash Bros.",
]

/* Duplicate for seamless infinite loop */
const DOUBLED_SCHOOLS = [...SCHOOLS, ...SCHOOLS]
const DOUBLED_GAMES = [...GAME_TITLES, ...GAME_TITLES]

export function MarqueeSection() {
  return (
    <div
      className="relative overflow-hidden py-4"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.012)",
      }}
      aria-label="Participating universities and supported game titles"
    >
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 h-full w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, oklch(0.10 0.02 265), transparent)",
        }}
        aria-hidden
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 h-full w-24 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, oklch(0.10 0.02 265), transparent)",
        }}
        aria-hidden
      />

      {/* Row 1: Schools scrolling left */}
      <div className="marquee-track mb-3" aria-hidden>
        {DOUBLED_SCHOOLS.map((school, i) => (
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

      {/* Row 2: Game titles scrolling right */}
      <div
        className="marquee-track"
        style={{ animationDirection: "reverse", animationDuration: "22s" }}
        aria-hidden
      >
        {DOUBLED_GAMES.map((game, i) => (
          <div key={i} className="flex items-center shrink-0">
            <span
              className="font-sans text-[11px] font-medium uppercase tracking-[0.22em] whitespace-nowrap px-6"
              style={{ color: "rgba(196,28,53,0.38)" }}
            >
              {game}
            </span>
            <span style={{ color: "rgba(196,28,53,0.12)", fontSize: "8px" }}>◆</span>
          </div>
        ))}
      </div>
    </div>
  )
}
