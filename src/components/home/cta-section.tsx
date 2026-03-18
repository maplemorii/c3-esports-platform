"use client"

import { motion } from "framer-motion"
import { useIsMobile } from "@/hooks/useIsMobile"
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button"

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]

interface CTASectionProps {
  isSignedIn: boolean
}

export function CTASection({ isSignedIn }: CTASectionProps) {
  const isMobile = useIsMobile()
  return (
    <section className="relative overflow-hidden px-4 py-40">
      {/* Grid overlay */}
      <div className="grid-bg absolute inset-0 pointer-events-none opacity-60" aria-hidden />

      {/* Iridescent glow — centered */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden
      >
        {/* Outer diffuse */}
        <div
          className="absolute rounded-full"
          style={{
            width: "700px",
            height: "400px",
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(59,130,246,0.22) 0%, rgba(59,130,246,0.10) 50%, transparent 72%)",
            filter: "blur(80px)",
          }}
        />
        {/* Animated pulsing orb */}
        <motion.div
          className="rounded-full"
          style={{
            width: isMobile ? "180px" : "260px",
            height: isMobile ? "180px" : "260px",
            background:
              "conic-gradient(from 180deg at 40% 42%, rgba(196,28,53,1), rgba(59,130,246,1), rgba(196,28,53,0.8), rgba(59,130,246,0.9), rgba(196,28,53,1))",
            filter: isMobile ? "blur(30px)" : "blur(55px)",
            opacity: 0.38,
          }}
          animate={isMobile ? {} : { scale: [1, 1.12, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, oklch(0.10 0.02 265) 100%)",
        }}
        aria-hidden
      />

      {/* Top border line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(196,28,53,0.4) 25%, rgba(59,130,246,0.4) 75%, transparent 100%)",
        }}
        aria-hidden
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-3xl flex flex-col items-center text-center">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.12)" }} />
          <span
            className="font-sans text-[10px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: "rgba(255,255,255,0.28)" }}
          >
            Season 4 · Registration Open
          </span>
          <div className="h-px w-10" style={{ background: "rgba(255,255,255,0.12)" }} />
        </motion.div>

        {/* Editorial headline */}
        <div className="flex flex-col items-center leading-none mb-8">
          <motion.p
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
            className="font-serif italic leading-tight mb-1"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 3.5rem)",
              color: "rgba(255,255,255,0.75)",
            }}
          >
            Your season starts
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.85, delay: 0.16, ease: EASE }}
            className="font-display font-bold text-white leading-none tracking-tight"
            style={{ fontSize: "clamp(3.5rem, 12vw, 8rem)" }}
          >
            RIGHT NOW.
          </motion.h2>
        </div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.24, ease: EASE }}
          className="font-sans text-sm leading-relaxed max-w-sm mb-12"
          style={{ color: "rgba(255,255,255,0.32)" }}
        >
          Registration is open. Form your squad, verify your school, and sign up before
          spots fill. Every division has a place for you.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.8, delay: 0.32, ease: EASE }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          {isSignedIn ? (
            <InteractiveHoverButton
              href="/dashboard"
              text="Go to Dashboard"
              className="w-auto px-8 py-4 text-sm"
            />
          ) : (
            <>
              <InteractiveHoverButton
                href="/auth/register"
                text="Create an Account"
                className="w-auto px-8 py-4 text-sm"
              />
              <InteractiveHoverButton
                href="/auth/signin"
                text="Sign In"
                className="w-auto px-8 py-4 text-sm border-white/15 bg-transparent text-white/60"
              />
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
