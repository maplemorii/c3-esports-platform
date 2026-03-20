"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { useRef, useCallback, useState, useEffect } from "react"

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  particleCount?: number
  href?: string
  children?: React.ReactNode
}

interface ParticleData {
  restX: number
  restY: number
}

const SPRING_ATTRACT = { stiffness: 50, damping: 10, mass: 0.5 }
const SPRING_RELEASE = { stiffness: 100, damping: 15, mass: 0.5 }

/* Isolated particle — never re-renders the parent */
const Particle = React.memo(function Particle({
  restX,
  restY,
  attracted,
}: ParticleData & { attracted: boolean }) {
  const x = useSpring(restX, attracted ? SPRING_ATTRACT : SPRING_RELEASE)
  const y = useSpring(restY, attracted ? SPRING_ATTRACT : SPRING_RELEASE)
  const opacity = useMotionValue(0.3)

  useEffect(() => {
    if (attracted) {
      x.set(0)
      y.set(0)
      opacity.set(1)
    } else {
      x.set(restX)
      y.set(restY)
      opacity.set(0.3)
    }
  }, [attracted, x, y, opacity, restX, restY])

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-white/60 pointer-events-none"
      style={{ x, y, opacity }}
    />
  )
})

function MagnetizeButton({
  className,
  particleCount = 8,
  href,
  children,
  onClick,
  ...props
}: MagnetizeButtonProps) {
  const isAttracted = useRef(false)
  const [attracted, setAttracted] = useState(false)
  const [particles, setParticles] = useState<ParticleData[]>([])

  useEffect(() => {
    setParticles(
      Array.from({ length: particleCount }, () => ({
        restX: Math.random() * 300 - 150,
        restY: Math.random() * 300 - 150,
      }))
    )
  }, [particleCount])

  const handleEnter = useCallback(() => {
    isAttracted.current = true
    setAttracted(true)
  }, [])

  const handleLeave = useCallback(() => {
    isAttracted.current = false
    setAttracted(false)
  }, [])

  const inner = (
    <>
      {particles.map((p, i) => (
        <Particle key={i} restX={p.restX} restY={p.restY} attracted={attracted} />
      ))}
      <span className="relative flex items-center justify-center gap-2 z-10">
        {children}
      </span>
    </>
  )

  const sharedClass = cn(
    "relative min-w-44 touch-none overflow-hidden",
    "inline-flex items-center justify-center",
    "rounded-full px-7 py-3.5 text-sm font-semibold text-white",
    "transition-shadow duration-300",
    attracted
      ? "shadow-[0_0_48px_rgba(196,28,53,0.45)]"
      : "shadow-[0_0_32px_rgba(196,28,53,0.25)]",
    className
  )

  const sharedStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, rgba(196,28,53,0.95), rgba(59,130,246,0.9))",
  }

  if (href) {
    return (
      <a
        href={href}
        className={sharedClass}
        style={sharedStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onTouchStart={handleEnter}
        onTouchEnd={handleLeave}
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      className={sharedClass}
      style={sharedStyle}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
      onTouchEnd={handleLeave}
      onClick={onClick}
      {...props}
    >
      {inner}
    </button>
  )
}

export { MagnetizeButton }
