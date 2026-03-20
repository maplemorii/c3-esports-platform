"use client"

import { useRef, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"
import { MagnetizeButton } from "@/components/ui/magnetize-button"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

const HERO_STATS = [
  { value: "56+", label: "Active Teams" },
  { value: "200+", label: "Matches" },
  { value: "3", label: "Titles" },
  { value: "NC / SC", label: "Region" },
]

interface HeroSectionProps {
  isSignedIn: boolean
}

export function HeroSection({ isSignedIn }: HeroSectionProps) {
  const containerRef = useRef<HTMLElement>(null)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const isMobile = useIsMobile()

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })

  const textY = useTransform(scrollYProgress, [0, 1], [0, 60])
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 0.93])

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] flex items-center overflow-hidden"
    >
      {/* Background — warm gradient, not flat void */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 75% 50%, rgba(180,60,60,0.07) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 15% 80%, rgba(80,130,200,0.04) 0%, transparent 50%),
            oklch(0.09 0.015 260)
          `,
        }}
        aria-hidden
      />

      {/* Subtle grid */}
      <div
        className="grid-bg absolute inset-0 pointer-events-none opacity-40"
        aria-hidden
      />

      {/* Top vignette for navbar blend */}
      <div
        className="absolute top-0 left-0 right-0 h-36 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, oklch(0.09 0.015 260) 20%, transparent)",
        }}
        aria-hidden
      />

      {/* ── Content: Split-screen ── */}
      <div className="relative z-10 mx-auto max-w-7xl w-full px-4 md:px-6 lg:px-8 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 lg:gap-20 items-center">
          {/* ── Left: Text ── */}
          <motion.div style={isMobile ? {} : { y: textY }}>
            {/* Season badge */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full px-4 py-2"
              style={{
                background: "rgba(180,60,60,0.10)",
                border: "1px solid rgba(180,60,60,0.22)",
              }}
            >
              <motion.div
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "oklch(0.52 0.20 17)" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span
                className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: "rgba(180,60,60,0.85)" }}
              >
                Season 4 -- Registration Open
              </span>
            </motion.div>

            {/* Headline — left-aligned, controlled scale */}
            <motion.h1
              className="font-display font-extrabold tracking-tighter leading-[0.92] mb-6"
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            >
              <span
                className="block text-white"
                style={{ fontSize: "clamp(2.6rem, 5vw, 4.2rem)" }}
              >
                Organized competition
              </span>
              <span
                className="block"
                style={{
                  fontSize: "clamp(2.6rem, 5vw, 4.2rem)",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                for Carolina esports.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="font-sans text-base leading-relaxed mb-8 max-w-[52ch]"
              style={{ color: "rgba(255,255,255,0.55)" }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.38, ease: EASE }}
            >
              The premier collegiate league spanning both Carolinas. Three
              titles, weekly matches, verified standings, and a path to real
              competition.
            </motion.p>

            {/* CTAs */}
            <motion.div
              className="flex flex-wrap items-center gap-4 mb-12"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.52, ease: EASE }}
            >
              <MagnetizeButton
                href={isSignedIn ? "/dashboard" : "/auth/register"}
                particleCount={14}
              >
                {isSignedIn ? "Go to Dashboard" : "Register your team"}
                <ArrowRight className="h-4 w-4" />
              </MagnetizeButton>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link
                  href="/seasons"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-colors duration-200"
                  style={{
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.04)",
                    color: "rgba(255,255,255,0.60)",
                  }}
                >
                  View Season 4
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats strip */}
            <motion.div
              className="flex flex-wrap gap-8 lg:gap-10 pt-7"
              style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7, ease: EASE }}
            >
              {HERO_STATS.map(({ value, label }) => (
                <div key={label}>
                  <span
                    className="block text-xl font-bold text-white tracking-tight"
                    style={{ fontFamily: "var(--font-data)" }}
                  >
                    {value}
                  </span>
                  <span
                    className="font-sans text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "rgba(255,255,255,0.35)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Video Player ── */}
          <motion.div
            className="relative"
            style={isMobile ? {} : { scale: videoScale }}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: EASE }}
          >
            {/* Video container with decorative frame */}
            <div
              className="relative rounded-2xl overflow-hidden aspect-video"
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              {/* Placeholder background — visible when no video loaded */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(145deg, oklch(0.13 0.03 17), oklch(0.10 0.02 250))",
                }}
              >
                <div className="text-center">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                    }}
                  >
                    <Play
                      className="h-7 w-7 ml-1"
                      style={{ color: "rgba(255,255,255,0.25)" }}
                    />
                  </div>
                  <p
                    className="font-sans text-sm"
                    style={{ color: "rgba(255,255,255,0.22)" }}
                  >
                    Highlight reel
                  </p>
                  <p
                    className="font-sans text-[10px] mt-1"
                    style={{ color: "rgba(255,255,255,0.12)" }}
                  >
                    Replace video source in hero-section.tsx
                  </p>
                </div>
              </div>

              {/* Video element — autoplay loop for highlight reel */}
              <video
                autoPlay
                loop
                muted
                playsInline
                onCanPlay={() => setVideoLoaded(true)}
                className="relative z-[1] w-full h-full object-cover"
                style={{
                  opacity: videoLoaded ? 1 : 0,
                  transition: "opacity 0.6s ease",
                }}
              >
                {
                  <source src="/highlights.mp4" type="video/mp4" />
                }
              </video>

              {/* Bottom gradient overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1/3 z-[2] pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
                }}
                aria-hidden
              />

              {/* Accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px] z-[3]"
                style={{
                  background:
                    "linear-gradient(90deg, oklch(0.52 0.20 17), oklch(0.58 0.16 250))",
                }}
                aria-hidden
              />
            </div>

            {/* Floating badge — bottom left */}
            <motion.div
              className="absolute -bottom-5 -left-3 lg:-left-5 rounded-xl px-4 py-2.5 z-[4] hidden sm:flex items-center gap-2.5"
              style={{
                background: "oklch(0.12 0.015 260)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1, ease: EASE }}
            >
              <motion.div
                className="h-2 w-2 rounded-full"
                style={{ background: "rgba(52,211,153,0.8)" }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="font-sans text-xs font-medium text-white">
                Live now
              </span>
              <span
                className="text-[10px]"
                style={{
                  fontFamily: "var(--font-data)",
                  color: "rgba(255,255,255,0.35)",
                }}
              >
                4 matches today
              </span>
            </motion.div>

            {/* Floating badge — top right */}
            <motion.div
              className="absolute -top-3 -right-2 lg:-right-4 rounded-lg px-3.5 py-2 z-[4] hidden sm:block"
              style={{
                background: "oklch(0.12 0.015 260)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.3, ease: EASE }}
            >
              <span
                className="font-sans text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                RL -- VAL -- OW2
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none z-[1]"
        style={{
          background:
            "linear-gradient(to top, oklch(0.09 0.015 260), transparent)",
        }}
        aria-hidden
      />
    </section>
  )
}
