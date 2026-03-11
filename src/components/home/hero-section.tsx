"use client"

import { useRef } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]
const SPRING = { stiffness: 55, damping: 22 }

/* ── Letter-by-letter stagger for white text ── */
function LetterReveal({
  text,
  delay = 0,
  className,
  style,
  isMobile,
}: {
  text: string
  delay?: number
  className?: string
  style?: React.CSSProperties
  isMobile?: boolean
}) {
  // On mobile: single-element fade+slide — avoids 7 simultaneous 3D-composited layers
  if (isMobile) {
    return (
      <motion.span
        className={className}
        style={style}
        aria-label={text}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay, ease: EASE }}
      >
        {text}
      </motion.span>
    )
  }

  return (
    <span className={className} style={style} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          // rotateX removed — it forces 3D compositing per letter, expensive on all devices
          initial={{ opacity: 0, y: 52 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.55,
            delay: delay + i * 0.038,
            ease: EASE,
          }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  )
}

interface HeroSectionProps {
  isSignedIn: boolean
}

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null)
  const isMobile = useIsMobile()

  /* ── Scroll parallax (skipped on mobile) ── */
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })
  const orbY   = useTransform(scrollYProgress, [0, 1], [0, -100])
  const textY  = useTransform(scrollYProgress, [0, 1], [0,  60])
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1,  0])

  /* ── Cursor glow (desktop only) ── */
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const cursorX = useSpring(rawX, SPRING)
  const cursorY = useSpring(rawY, SPRING)
  const cursorGlowBg = useTransform(
    [cursorX, cursorY],
    ([x, y]: number[]) =>
      `radial-gradient(480px circle at ${x}px ${y}px, rgba(59,130,246,0.065), transparent 65%)`
  )

  function handleMouseMove(e: React.MouseEvent<HTMLElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    rawX.set(e.clientX - rect.left)
    rawY.set(e.clientY - rect.top)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={isMobile ? undefined : handleMouseMove}
      className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-28"
    >
      {/* ── GRID ── */}
      <div className="grid-bg absolute inset-0 pointer-events-none" aria-hidden />

      {/* ── CURSOR GLOW (desktop only) ── */}
      {!isMobile && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ background: cursorGlowBg }}
          aria-hidden
        />
      )}

      {/* ── TOP VIGNETTE — protects text readability ── */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] pointer-events-none z-0"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.07 0.02 265) 0%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* ── BOTTOM ORB — glowing abyss beneath text ── */}
      <motion.div
        style={{ y: isMobile ? 0 : orbY }}
        className="absolute bottom-[-8%] left-1/2 -translate-x-1/2 pointer-events-none z-0"
        aria-hidden
      >
        {/* Wide upward diffusion */}
        <div
          style={{
            width: isMobile ? "420px" : "960px",
            height: isMobile ? "280px" : "620px",
            transform: "translateX(-50%)",
            background:
              "radial-gradient(ellipse at 50% 88%, rgba(59,130,246,0.32) 0%, rgba(59,130,246,0.13) 46%, transparent 70%)",
            filter: isMobile ? "blur(40px)" : "blur(90px)",
          }}
        />

        {/* Animated orb core */}
        <motion.div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: isMobile ? "200px" : "320px",
            height: isMobile ? "200px" : "320px",
            transform: "translateX(-50%)",
          }}
          animate={isMobile ? {} : { scale: [1, 1.08, 1], rotate: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background:
                "conic-gradient(from 200deg at 40% 42%, rgba(196,28,53,1) 0deg, rgba(59,130,246,1) 120deg, rgba(196,28,53,0.8) 240deg, rgba(59,130,246,1) 360deg)",
              filter: "blur(44px)",
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: "30%",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 32% 28%, rgba(196,28,53,0.9), rgba(59,130,246,0.8) 52%, rgba(59,130,246,0.5) 85%)",
              filter: "blur(10px)",
            }}
          />
          {/* Specular */}
          <div
            style={{
              position: "absolute",
              top: "12%",
              left: "16%",
              width: "28%",
              height: "22%",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.7), transparent)",
              filter: "blur(5px)",
            }}
          />
        </motion.div>
      </motion.div>

      {/* ── BOTTOM EDGE FADE ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none z-0"
        style={{
          background: "linear-gradient(to top, oklch(0.07 0.02 265), transparent)",
        }}
        aria-hidden
      />

      {/* ── MAIN CONTENT ── */}
      <motion.div
        style={{ y: isMobile ? 0 : textY, opacity: isMobile ? 1 : fadeOut }}
        className="relative z-10 flex flex-col items-center text-center max-w-6xl mx-auto select-none"
      >
        {/* Season label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.1 }}
          className="mb-10 flex items-center gap-4"
        >
          <motion.div
            className="h-px w-10"
            style={{ background: "rgba(255,255,255,0.12)" }}
            initial={{ scaleX: 0, originX: "right" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <span
            className="font-sans text-[10px] font-medium uppercase tracking-[0.28em]"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Carolina Collegiate Clash · Season 4
          </span>
          <motion.div
            className="h-px w-10"
            style={{ background: "rgba(255,255,255,0.12)" }}
            initial={{ scaleX: 0, originX: "left" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
        </motion.div>

        {/* ── EDITORIAL HEADLINE ── */}
        <div className="flex flex-col items-center" style={{ perspective: "800px" }}>

          {/* Serif italic — refined & aspirational */}
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18, ease: EASE }}
            className="font-serif italic leading-tight mb-2"
            style={{
              fontSize: "clamp(1.9rem, 5vw, 4.5rem)",
              color: "rgba(255,255,255,0.82)",
              textShadow: "0 0 60px rgba(255,255,255,0.08)",
            }}
          >
            Compete at the
          </motion.p>

          {/* MASSIVE word — letter-by-letter stagger */}
          <LetterReveal
            text="HIGHEST"
            delay={0.30}
            isMobile={isMobile}
            className="font-display font-bold text-white leading-none tracking-tight block"
            style={{
              fontSize: "clamp(4.5rem, 17vw, 12rem)",
              textShadow: "0 2px 40px rgba(0,0,0,0.6)",
            }}
          />

          {/* MASSIVE gradient word — clip-path wipe reveal */}
          <div
            className="font-display font-bold leading-none tracking-tight block overflow-hidden"
            style={{ fontSize: "clamp(4.5rem, 17vw, 12rem)" }}
          >
            <motion.span
              className="block"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 0.85, delay: 0.60, ease: EASE }}
              style={{
                background: "linear-gradient(120deg, rgba(196,28,53,0.95) 0%, rgba(59,130,246,0.95) 55%, rgba(196,28,53,0.8) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                display: "block",
              }}
            >
              LEVEL.
            </motion.span>
          </div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.80, ease: EASE }}
          className="mt-8 max-w-sm font-sans text-sm leading-relaxed"
          style={{ color: "rgba(255,255,255,0.30)" }}
        >
          The premier Rocket League league for college students across North &amp; South
          Carolina. Structured seasons. Ranked divisions. Real competition.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.92, ease: EASE }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href={isSignedIn ? "/dashboard" : "/auth/register"}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, rgba(196,28,53,0.95), rgba(59,130,246,0.9))",
                boxShadow: "0 0 32px rgba(196,28,53,0.25)",
              }}
            >
              {isSignedIn ? "Go to Dashboard" : "Register Your Team"}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/seasons"
              className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm font-medium backdrop-blur-sm transition-all duration-200"
              style={{
                borderColor: "rgba(255,255,255,0.11)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.50)",
              }}
            >
              View Seasons
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── FLOATING CARD — LIVE MATCH (right) ── */}
      <motion.div
        className="absolute right-8 top-[36%] hidden xl:block z-20"
        initial={{ opacity: 0, x: 60, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.0, delay: 1.1, ease: EASE }}
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
        >
          <div
            className="w-64 rounded-2xl p-5 shadow-2xl cursor-default"
            style={{
              background: "rgba(255,255,255,0.032)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span
                  className="font-sans text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.36)" }}
                >
                  Live Match
                </span>
              </div>
              <span className="font-sans text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                Game 5
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.30)" }}
                  >
                    <span className="font-display text-[8px] font-bold text-blue-400">NC</span>
                  </div>
                  <span className="font-sans text-xs font-medium" style={{ color: "rgba(255,255,255,0.80)" }}>
                    NC State RL
                  </span>
                </div>
                <span className="font-display text-base font-bold text-white">3</span>
              </div>

              <div className="h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center"
                    style={{ background: "rgba(59,130,246,0.14)", border: "1px solid rgba(59,130,246,0.25)" }}
                  >
                    <span className="font-display text-[8px] font-bold text-cyan-400">UNC</span>
                  </div>
                  <span className="font-sans text-xs font-medium" style={{ color: "rgba(255,255,255,0.40)" }}>
                    UNC Chapel Hill
                  </span>
                </div>
                <span className="font-display text-base font-bold" style={{ color: "rgba(255,255,255,0.32)" }}>
                  2
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="h-0.5 flex-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.9), rgba(59,130,246,0.9))", width: "62%" }}
                  animate={{ width: ["60%", "65%", "60%"] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <span className="font-sans text-[9px] uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.16)" }}>
                Premier
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── FLOATING CARD — STANDINGS (left) ── */}
      <motion.div
        className="absolute left-8 bottom-[26%] hidden xl:block z-20"
        initial={{ opacity: 0, x: -60, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 1.0, delay: 1.25, ease: EASE }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
        >
          <div
            className="w-60 rounded-2xl p-5 shadow-2xl cursor-default"
            style={{
              background: "rgba(255,255,255,0.032)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                className="font-sans text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "rgba(255,255,255,0.36)" }}
              >
                Standings
              </span>
              <span className="font-sans text-[10px]" style={{ color: "rgba(255,255,255,0.18)" }}>
                Season 4
              </span>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: "NC State RL",    record: "8–0", accent: "rgba(59,130,246,0.9)" },
                { rank: 2, name: "UNC Chapel Hill", record: "7–1", accent: "rgba(255,255,255,0.55)" },
                { rank: 3, name: "Duke Gaming",     record: "6–2", accent: "rgba(255,255,255,0.35)" },
                { rank: 4, name: "App State RL",    record: "5–3", accent: "rgba(255,255,255,0.22)" },
              ].map((team, i) => (
                <motion.div
                  key={team.rank}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 1.3 + i * 0.07, ease: EASE }}
                >
                  <span
                    className="font-display text-[10px] font-bold w-3 shrink-0 tabular-nums"
                    style={{ color: team.accent }}
                  >
                    {team.rank}
                  </span>
                  <span
                    className="font-sans text-xs flex-1 truncate"
                    style={{ color: "rgba(255,255,255,0.52)" }}
                  >
                    {team.name}
                  </span>
                  <span
                    className="font-sans text-[10px] font-semibold tabular-nums"
                    style={{ color: "rgba(255,255,255,0.30)" }}
                  >
                    {team.record}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── SCROLL INDICATOR ── */}
      <motion.div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.8 }}
        aria-hidden
      >
        <motion.div
          animate={isMobile ? {} : { y: [0, 7, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-12 mx-auto"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0.20), transparent)",
          }}
        />
      </motion.div>
    </section>
  )
}
