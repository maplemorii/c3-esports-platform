"use client"

import { useState, useEffect } from "react"

/** Returns true on touch-primary devices (phones/tablets with no fine pointer). */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(hover: none)")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return mobile
}
