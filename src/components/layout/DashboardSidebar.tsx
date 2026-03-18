"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Users,
  Swords,
  Trophy,
  UserCircle,
  Map,
  Calendar,
  UserCog,
  ClipboardList,
  AlertTriangle,
  BarChart2,
  Menu,
  X,
} from "lucide-react"
import { SidebarProvider, DesktopSidebar, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { hasMinRole } from "@/lib/roles"
import type { Role } from "@/lib/roles"

// ---------------------------------------------------------------------------
// Nav definitions
// ---------------------------------------------------------------------------
const USER_NAV = [
  { href: "/dashboard",         label: "Dashboard", icon: LayoutDashboard },
  { href: "/team",              label: "My Teams",  icon: Users },
  { href: "/dashboard/matches", label: "Matches",   icon: Swords },
  { href: "/standings",         label: "Standings", icon: Trophy },
  { href: "/profile",           label: "Profile",   icon: UserCircle },
  { href: "/roadmap",           label: "Roadmap",   icon: Map },
]

const STAFF_NAV = [
  { href: "/admin",               label: "Overview",       icon: LayoutDashboard },
  { href: "/admin/seasons",       label: "Seasons",        icon: Calendar },
  { href: "/admin/teams",         label: "Teams",          icon: Users },
  { href: "/admin/matches",       label: "Matches",        icon: Swords },
  { href: "/admin/standings",     label: "Standings",      icon: BarChart2 },
  { href: "/admin/registrations", label: "Registrations",  icon: ClipboardList },
  { href: "/admin/disputes",      label: "Disputes",       icon: AlertTriangle },
]

const ADMIN_EXTRA_NAV = [
  { href: "/admin/users", label: "Users",     icon: UserCog },
  { href: "/admin/audit", label: "Audit Log", icon: ClipboardList },
]

// For STAFF+: personal section shows only unique personal pages
const STAFF_PERSONAL_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/team",      label: "My Teams",  icon: Users },
  { href: "/profile",   label: "Profile",   icon: UserCircle },
  { href: "/roadmap",   label: "Roadmap",   icon: Map },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useIsActive() {
  const pathname = usePathname()
  return (href: string) => {
    if (href === "/admin" || href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }
}

// ---------------------------------------------------------------------------
// Logo
// ---------------------------------------------------------------------------
function C3Logo() {
  const { open, animate } = useSidebar()
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 px-1 py-1 mb-2">
      <Image
        src="/logo.png"
        alt="C3 Esports"
        width={120}
        height={30}
        style={{ height: "20px", width: "auto", flexShrink: 0 }}
        priority
      />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="font-display text-[10px] font-bold uppercase tracking-[0.22em] whitespace-pre"
        style={{ color: "rgba(255,255,255,0.25)" }}
      >
        Platform
      </motion.span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Section separator
// ---------------------------------------------------------------------------
function SectionDivider({ label }: { label: string }) {
  const { open, animate } = useSidebar()
  return (
    <div className="flex items-center gap-2 px-1 mt-5 mb-2">
      <motion.span
        animate={{ opacity: animate ? (open ? 1 : 0) : 1, width: animate ? (open ? "auto" : 0) : "auto" }}
        className="text-[9px] font-bold uppercase tracking-[0.25em] whitespace-nowrap overflow-hidden"
        style={{ color: "rgba(255,255,255,0.18)" }}
      >
        {label}
      </motion.span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Role pill
// ---------------------------------------------------------------------------
function RolePill({ role }: { role: Role }) {
  const { open, animate } = useSidebar()
  if (!hasMinRole(role, "STAFF")) return null

  const cfg = hasMinRole(role, "DEVELOPER")
    ? { label: "Developer", short: "DEV",   color: "rgba(99,102,241,0.9)",  bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)" }
    : hasMinRole(role, "ADMIN")
    ? { label: "Admin",     short: "ADMIN", color: "rgba(196,28,53,0.9)",   bg: "rgba(196,28,53,0.12)",  border: "rgba(196,28,53,0.25)" }
    : { label: "Staff",     short: "STAFF", color: "rgba(251,146,60,0.9)",  bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.25)" }

  return (
    <div className="px-1 mb-3">
      <motion.span
        animate={{
          padding: animate ? (open ? "2px 10px" : "2px 6px") : "2px 10px",
        }}
        className="inline-flex items-center justify-center rounded-full text-[9px] font-bold uppercase tracking-[0.20em]"
        style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <motion.span
          animate={{
            display: animate ? (open ? "inline" : "none") : "inline",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
        >
          {cfg.label}
        </motion.span>
        <motion.span
          animate={{
            display: animate ? (open ? "none" : "inline") : "none",
            opacity: animate ? (open ? 0 : 1) : 0,
          }}
        >
          {cfg.short}
        </motion.span>
      </motion.span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// User footer
// ---------------------------------------------------------------------------
function UserFooter({ name, image }: { name: string; image?: string | null }) {
  const { open, animate } = useSidebar()
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2.5 p-2 rounded-xl transition-all duration-150 group"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"
        ;(e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"
      }}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={30}
          height={30}
          className="rounded-full object-cover shrink-0"
          style={{ height: "30px", width: "30px", minWidth: "30px", boxShadow: "0 0 0 1px rgba(255,255,255,0.10)" }}
        />
      ) : (
        <div
          className="rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{
            height: "30px", width: "30px", minWidth: "30px",
            background: "linear-gradient(135deg, rgba(196,28,53,0.85), rgba(59,130,246,0.75))",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.10)",
          }}
        >
          {initials}
        </div>
      )}
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex flex-col min-w-0 flex-1"
      >
        <span
          className="text-[13px] font-semibold truncate leading-tight"
          style={{ color: "rgba(255,255,255,0.80)" }}
        >
          {name}
        </span>
        <span className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.28)" }}>
          View profile →
        </span>
      </motion.div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Nav content — shared between desktop expanded state and mobile drawer
// ---------------------------------------------------------------------------
function NavContent({
  role,
  name,
  image,
  onNavigate,
}: {
  role: Role
  name: string
  image?: string | null
  onNavigate?: () => void
}) {
  const isActive = useIsActive()
  const isStaff = hasMinRole(role, "STAFF")
  const isAdmin = hasMinRole(role, "ADMIN")

  const link = (item: { href: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) => ({
    href: item.href,
    label: item.label,
    icon: <item.icon className="h-4.25 w-4.25 shrink-0" />,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <C3Logo />

        {/* Hairline accent */}
        <div
          className="h-px mb-3 mx-1"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.5), rgba(59,130,246,0.25), transparent)" }}
          aria-hidden
        />

        <RolePill role={role} />

        {isStaff ? (
          <>
            {/* Admin navigation */}
            <div className="flex flex-col gap-0.5">
              {STAFF_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  link={link(item)}
                  active={isActive(item.href)}
                  onClick={onNavigate}
                />
              ))}
              {isAdmin && ADMIN_EXTRA_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  link={link(item)}
                  active={isActive(item.href)}
                  onClick={onNavigate}
                />
              ))}
            </div>

            {/* Personal section */}
            <SectionDivider label="My Account" />
            <div className="flex flex-col gap-0.5">
              {STAFF_PERSONAL_NAV.map((item) => (
                <SidebarLink
                  key={item.href + "-p"}
                  link={link(item)}
                  active={isActive(item.href)}
                  onClick={onNavigate}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-0.5">
            {USER_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                link={link(item)}
                active={isActive(item.href)}
                onClick={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pinned user footer */}
      <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <UserFooter name={name} image={image} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Desktop sidebar (md+) — icon rail that expands on hover
// ---------------------------------------------------------------------------
export function DashboardSidebar({
  role,
  userName,
  userImage,
}: {
  role: Role
  userName: string
  userImage?: string | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <SidebarProvider open={open} setOpen={setOpen}>
      <DesktopSidebar
        className="border-r border-sidebar-border overflow-hidden"
        style={{ background: "var(--sidebar)", minHeight: "calc(100vh - 4rem)" }}
      >
        <NavContent role={role} name={userName} image={userImage} />
      </DesktopSidebar>
    </SidebarProvider>
  )
}

// ---------------------------------------------------------------------------
// Mobile header bar + slide-in drawer (< md)
// ---------------------------------------------------------------------------
export function DashboardMobileHeader({
  role,
  userName,
  userImage,
}: {
  role: Role
  userName: string
  userImage?: string | null
}) {
  const [open, setOpen] = useState(false)
  const initials = userName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <>
      {/* Thin top bar */}
      <div
        className="flex md:hidden h-14 items-center justify-between px-4 border-b shrink-0"
        style={{ background: "var(--sidebar)", borderColor: "var(--sidebar-border)" }}
      >
        <Link href="/dashboard">
          <Image
            src="/logo.png"
            alt="C3 Esports"
            width={100}
            height={26}
            style={{ height: "20px", width: "auto" }}
            priority
          />
        </Link>

        <div className="flex items-center gap-2.5">
          {userImage ? (
            <Image
              src={userImage}
              alt={userName}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
              style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.10)" }}
            />
          ) : (
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{
                background: "linear-gradient(135deg, rgba(196,28,53,0.85), rgba(59,130,246,0.75))",
                boxShadow: "0 0 0 1px rgba(255,255,255,0.10)",
              }}
            >
              {initials}
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center h-8 w-8 rounded-lg"
            style={{ color: "rgba(255,255,255,0.55)", background: "rgba(255,255,255,0.05)" }}
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide-in drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: "rgba(0,0,0,0.65)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden flex flex-col p-4"
              style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <button
                onClick={() => setOpen(false)}
                className="absolute right-3 top-3 rounded-lg p-1.5"
                style={{ color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)" }}
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Wrap in a fake provider with animate=false so labels always show */}
              <SidebarProvider open={true} setOpen={() => {}} animate={false}>
                <NavContent
                  role={role}
                  name={userName}
                  image={userImage}
                  onNavigate={() => setOpen(false)}
                />
              </SidebarProvider>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
