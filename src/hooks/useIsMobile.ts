"use client"

import { useState, useEffect } from "react"

/** Returns true on touch-primary devices (phones/tablets with no fine pointer). */
export function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    setMobile(window.matchMedia("(hover: none)").matches)
  }, [])
  return mobile
}
