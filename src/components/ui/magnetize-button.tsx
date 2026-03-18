"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, useAnimation } from "framer-motion"
import { useEffect, useState, useCallback } from "react"

interface MagnetizeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  particleCount?: number
  attractRadius?: number
  href?: string
  children?: React.ReactNode
}

interface Particle {
  id: number
  x: number
  y: number
}

function MagnetizeButton({
  className,
  particleCount = 12,
  attractRadius = 50,
  href,
  children,
  onClick,
  ...props
}: MagnetizeButtonProps) {
  const [isAttracting, setIsAttracting] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const particlesControl = useAnimation()

  useEffect(() => {
    setParticles(
      Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 360 - 180,
        y: Math.random() * 360 - 180,
      }))
    )
  }, [particleCount])

  const handleInteractionStart = useCallback(async () => {
    setIsAttracting(true)
    await particlesControl.start({
      x: 0,
      y: 0,
      transition: { type: "spring", stiffness: 50, damping: 10 },
    })
  }, [particlesControl])

  const handleInteractionEnd = useCallback(async () => {
    setIsAttracting(false)
    await particlesControl.start((i: number) => ({
      x: particles[i]?.x ?? 0,
      y: particles[i]?.y ?? 0,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    }))
  }, [particlesControl, particles])

  const inner = (
    <>
      {particles.map((_, index) => (
        <motion.div
          key={index}
          custom={index}
          initial={{ x: particles[index]?.x ?? 0, y: particles[index]?.y ?? 0 }}
          animate={particlesControl}
          className={cn(
            "absolute w-1.5 h-1.5 rounded-full pointer-events-none",
            "bg-white/60",
            isAttracting ? "opacity-100" : "opacity-30"
          )}
        />
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
    "transition-all duration-300",
    "shadow-[0_0_32px_rgba(196,28,53,0.25)]",
    isAttracting && "shadow-[0_0_48px_rgba(196,28,53,0.45)]",
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
        onMouseEnter={handleInteractionStart}
        onMouseLeave={handleInteractionEnd}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
      >
        {inner}
      </a>
    )
  }

  return (
    <button
      className={sharedClass}
      style={sharedStyle}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onClick={onClick}
      {...props}
    >
      {inner}
    </button>
  )
}

export { MagnetizeButton }
