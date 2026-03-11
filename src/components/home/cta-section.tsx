"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { useIsMobile } from "@/hooks/useIsMobile"

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
              "conic-gradient(from 180deg at 40% 42%, #7c3aed, #06b6d4, #a855f7, #0ea5e9, #7c3aed)",
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
            "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 20%, oklch(0.07 0.02 265) 100%)",
        }}
        aria-hidden
      />

      {/* Top border line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 30%, rgba(59,130,246,0.4) 70%, transparent 100%)",
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
            <Link
              href="/dashboard"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all duration-200 hover:bg-white/90 active:scale-95"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full px-8 py-4 text-sm font-semibold text-white transition-all duration-200 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #06b6d4)",
                  boxShadow: "0 0 40px rgba(59,130,246,0.35)",
                }}
              >
                <span className="relative">Create an Account</span>
                <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 rounded-full border px-8 py-4 text-sm font-medium backdrop-blur-sm transition-all duration-200"
                style={{
                  borderColor: "rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </motion.div>
      </div>
    </section>
  )
}
