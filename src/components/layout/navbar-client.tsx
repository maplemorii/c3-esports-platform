"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import type { Session } from "next-auth"
import { UserMenu } from "./user-menu"
import MegaMenu from "@/components/ui/mega-menu"
import type { MegaMenuItem } from "@/components/ui/mega-menu"
import {
  Trophy,
  CalendarDays,
  BarChart2,
  BookOpen,
  Swords,
  Users,
  UserCircle,
  PlusCircle,
  HelpCircle,
} from "lucide-react"

const MEGA_NAV_ITEMS: MegaMenuItem[] = [
  {
    id: 1,
    label: "League",
    subMenus: [
      {
        title: "Season",
        items: [
          { label: "Seasons",   description: "Browse all seasons and divisions", icon: Trophy,      href: "/seasons"  },
          { label: "Matches",   description: "Live and completed match results",  icon: Swords,      href: "/matches"  },
          { label: "Standings", description: "Rankings, records, and points",     icon: BarChart2,   href: "/seasons"  },
        ],
      },
      {
        title: "Info",
        items: [
          { label: "Schedule",  description: "Upcoming match schedule",           icon: CalendarDays, href: "/schedule" },
          { label: "Rules",     description: "Official competition rulebook",      icon: BookOpen,     href: "/rules"    },
        ],
      },
    ],
  },
  {
    id: 2,
    label: "Teams",
    subMenus: [
      {
        title: "Directory",
        items: [
          { label: "All Teams", description: "Browse competing organizations",    icon: Users,      href: "/teams"         },
          { label: "Players",   description: "Player profiles and rosters",       icon: UserCircle, href: "/teams"         },
        ],
      },
      {
        title: "Join",
        items: [
          { label: "Register",  description: "Enter your team in Season 4",       icon: PlusCircle, href: "/auth/register"  },
          { label: "Support",   description: "Get help from our staff",            icon: HelpCircle, href: "/support"        },
        ],
      },
    ],
  },
  { id: 3, label: "Docs", link: "https://docs.c3esports.com" },
]

/* Flat links used in mobile menu */
const MOBILE_NAV_LINKS = [
  { href: "/seasons",        label: "Seasons"  },
  { href: "/matches",        label: "Matches"  },
  { href: "/teams",          label: "Teams"    },
  { href: "/rules",          label: "Rules"    },
  { href: "https://docs.c3esports.com", label: "Docs" },
]

interface NavbarClientProps {
  session: Session | null
}

export function NavbarClient({ session }: NavbarClientProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  /* Close mobile menu on route change / resize */
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 w-full"
        animate={{
          backgroundColor: scrolled ? "rgba(5,8,20,0.92)" : "rgba(5,8,20,0)",
          borderBottomColor: scrolled
            ? "rgba(255,255,255,0.07)"
            : "rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.28, ease: "easeInOut" }}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
        }}
      >
        {/* C3 red→blue glow line at very top — only when scrolled */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px pointer-events-none"
          animate={{ opacity: scrolled ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(196,28,53,0.6) 30%, rgba(59,130,246,0.5) 70%, transparent 100%)",
          }}
          aria-hidden
        />

        <div className="mx-auto flex h-16 max-w-7xl items-center px-5">

          {/* ── LOGO ── */}
          <Link
            href="/"
            className="shrink-0 flex items-center"
            aria-label="C3 Esports — home"
          >
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.18 }}
            >
              <Image
                src="/logo.png"
                alt="C3 Esports"
                width={200}
                height={48}
                style={{ height: "30px", width: "auto" }}
                priority
              />
            </motion.div>
          </Link>

          {/* ── DESKTOP NAV ── */}
          <nav className="hidden md:flex ml-6 items-center">
            <MegaMenu items={MEGA_NAV_ITEMS} />
          </nav>

          {/* ── RIGHT SIDE ── */}
          <div className="ml-auto flex items-center gap-3">
            {/* Season pill — desktop, fades as you scroll */}
            <motion.div
              animate={{ opacity: scrolled ? 0 : 1, x: scrolled ? 8 : 0 }}
              transition={{ duration: 0.25 }}
              className="hidden lg:flex items-center gap-2 rounded-full px-3.5 py-1.5 pointer-events-none"
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.04)",
              }}
              aria-hidden={scrolled}
            >
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <span
                className="font-sans text-[11px] font-medium tracking-wide"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                Season 4 Open
              </span>
            </motion.div>

            {/* Auth */}
            {session ? (
              <UserMenu session={session} />
            ) : (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center rounded-full font-sans text-sm font-medium px-5 py-2 transition-all duration-200"
                  style={{
                    border: "1px solid rgba(255,255,255,0.13)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(255,255,255,0.10)"
                    el.style.color = "rgba(255,255,255,0.90)"
                    el.style.borderColor = "rgba(255,255,255,0.22)"
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = "rgba(255,255,255,0.05)"
                    el.style.color = "rgba(255,255,255,0.65)"
                    el.style.borderColor = "rgba(255,255,255,0.13)"
                  }}
                >
                  Sign In
                </Link>
              </motion.div>
            )}

            {/* Mobile hamburger */}
            <button
              className="ml-1 flex md:hidden flex-col justify-center items-center gap-1.5 w-8 h-8 rounded-lg transition-colors"
              style={{ background: mobileOpen ? "rgba(255,255,255,0.08)" : "transparent" }}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              <motion.span
                animate={mobileOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22 }}
                className="block w-4.5 h-px rounded-full"
                style={{ background: "rgba(255,255,255,0.65)", width: "18px", height: "1.5px" }}
              />
              <motion.span
                animate={mobileOpen ? { opacity: 0, x: -4 } : { opacity: 1, x: 0 }}
                transition={{ duration: 0.18 }}
                className="block rounded-full"
                style={{ background: "rgba(255,255,255,0.65)", width: "18px", height: "1.5px" }}
              />
              <motion.span
                animate={mobileOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                transition={{ duration: 0.22 }}
                className="block rounded-full"
                style={{ background: "rgba(255,255,255,0.65)", width: "18px", height: "1.5px" }}
              />
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-x-0 top-16 z-40 md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div
              className="mx-3 mt-1 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(5,8,20,0.97)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(24px)",
              }}
            >
              <nav className="flex flex-col p-2">
                {MOBILE_NAV_LINKS.map(({ href, label }, i) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                  >
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3.5 rounded-xl font-sans text-sm font-medium transition-colors duration-150"
                      style={{ color: "rgba(255,255,255,0.55)" }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.90)"
                        ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.55)"
                        ;(e.currentTarget as HTMLElement).style.background = "transparent"
                      }}
                    >
                      {label}
                    </Link>
                  </motion.div>
                ))}

                {!session && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: MOBILE_NAV_LINKS.length * 0.05 }}
                    className="mt-1 p-2"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <Link
                      href="/auth/signin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center w-full rounded-xl font-sans text-sm font-medium px-4 py-3 transition-all duration-150"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        color: "rgba(255,255,255,0.70)",
                        border: "1px solid rgba(255,255,255,0.10)",
                      }}
                    >
                      Sign In
                    </Link>
                  </motion.div>
                )}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer so content doesn't sit under the fixed navbar */}
      <div className="h-16" aria-hidden />
    </>
  )
}
