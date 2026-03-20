"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { MagnetizeButton } from "@/components/ui/magnetize-button"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface CTASectionProps {
  isSignedIn: boolean
}

export function CTASection({ isSignedIn }: CTASectionProps) {
  return (
    <section className="relative overflow-hidden px-4 md:px-6 lg:px-8 py-32">
      {/* Rich gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 30% 50%, rgba(180,60,60,0.08) 0%, transparent 60%),
            linear-gradient(180deg, oklch(0.09 0.015 260) 0%, oklch(0.11 0.03 17) 40%, oklch(0.10 0.025 250) 70%, oklch(0.09 0.015 260) 100%)
          `,
        }}
        aria-hidden
      />

      {/* Grid overlay */}
      <div
        className="grid-bg absolute inset-0 pointer-events-none opacity-30"
        aria-hidden
      />

      {/* Top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(180,60,60,0.35) 50%, transparent)",
        }}
        aria-hidden
      />

      {/* Content — left aligned (DESIGN_VARIANCE 8) */}
      <div className="relative z-[1] mx-auto max-w-7xl">
        <div className="max-w-2xl">
          {/* Season badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mb-6 flex items-center gap-2.5"
          >
            <motion.div
              className="h-2 w-2 rounded-full"
              style={{ background: "oklch(0.52 0.20 17)" }}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span
              className="font-sans text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Season 4 -- Registration open
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            className="font-display font-bold text-white leading-[0.92] tracking-tight mb-6"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
          >
            Your season
            <br />
            starts now.
          </motion.h2>

          {/* Description */}
          <motion.p
            className="font-sans text-base leading-relaxed mb-8 max-w-lg"
            style={{ color: "rgba(255,255,255,0.50)" }}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.18, ease: EASE }}
          >
            Registration is open. Form your squad, verify your school, and sign
            up before spots fill.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.26, ease: EASE }}
          >
            {isSignedIn ? (
              <MagnetizeButton href="/dashboard" particleCount={14}>
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </MagnetizeButton>
            ) : (
              <>
                <MagnetizeButton href="/auth/register" particleCount={14}>
                  Create an account
                  <ArrowRight className="h-4 w-4" />
                </MagnetizeButton>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    href="/auth/signin"
                    className="inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold transition-colors duration-200"
                    style={{
                      border: "1px solid rgba(255,255,255,0.10)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    Sign in
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
