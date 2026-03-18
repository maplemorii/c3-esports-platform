"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
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
  Shield,
  ChevronRight,
} from "lucide-react"
import { Sidebar, SidebarBody, DesktopSidebar, MobileSidebar, SidebarLink, useSidebar } from "@/components/ui/sidebar"
import { hasMinRole } from "@/lib/roles"
import type { Role } from "@/lib/roles"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Nav item definitions per role tier
// ---------------------------------------------------------------------------
const USER_NAV = [
  { href: "/dashboard",         label: "Dashboard",  icon: LayoutDashboard },
  { href: "/team",              label: "My Teams",   icon: Users },
  { href: "/dashboard/matches", label: "Matches",    icon: Swords },
  { href: "/standings",         label: "Standings",  icon: Trophy },
  { href: "/profile",           label: "Profile",    icon: UserCircle },
  { href: "/roadmap",           label: "Roadmap",    icon: Map },
]

const STAFF_NAV = [
  { href: "/admin",                 label: "Overview",       icon: LayoutDashboard },
  { href: "/admin/seasons",         label: "Seasons",        icon: Calendar },
  { href: "/admin/teams",           label: "Teams",          icon: Users },
  { href: "/admin/matches",         label: "Matches",        icon: Swords },
  { href: "/admin/standings",       label: "Standings",      icon: BarChart2 },
  { href: "/admin/registrations",   label: "Registrations",  icon: ClipboardList },
  { href: "/admin/disputes",        label: "Disputes",       icon: AlertTriangle },
]

const ADMIN_EXTRA_NAV = [
  { href: "/admin/users",  label: "Users",     icon: UserCog },
  { href: "/admin/audit",  label: "Audit Log", icon: ClipboardList },
]

// ---------------------------------------------------------------------------
// C3 logo — full + icon-only
// ---------------------------------------------------------------------------
function C3Logo() {
  const { open, animate } = useSidebar()
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5 py-1 relative z-20 mb-1">
      <Image
        src="/logo.png"
        alt="C3 Esports"
        width={120}
        height={30}
        style={{ height: "22px", width: "auto", flexShrink: 0 }}
        priority
      />
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="font-display text-xs font-semibold uppercase tracking-[0.18em] whitespace-pre"
        style={{ color: "rgba(255,255,255,0.30)" }}
      >
        Platform
      </motion.span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Section divider with label
// ---------------------------------------------------------------------------
function SectionLabel({ label }: { label: string }) {
  const { open, animate } = useSidebar()
  return (
    <motion.div
      className="flex items-center gap-2 px-2 mt-4 mb-1"
      animate={{
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
    >
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.20em] whitespace-pre"
        style={{ color: "rgba(255,255,255,0.20)" }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// User footer pinned at the bottom of the sidebar
// ---------------------------------------------------------------------------
function UserFooter({ name, image }: { name: string; image?: string | null }) {
  const { open, animate } = useSidebar()
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()

  return (
    <Link
      href="/profile"
      className="flex items-center gap-2.5 p-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.06)] group"
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0"
        />
      ) : (
        <div
          className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-1 ring-white/10"
          style={{ background: "linear-gradient(135deg, rgba(196,28,53,0.8), rgba(59,130,246,0.7))" }}
        >
          {initials}
        </div>
      )}
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex flex-col min-w-0"
      >
        <span className="text-sm font-medium text-white/75 group-hover:text-white/95 truncate transition-colors leading-tight">
          {name}
        </span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
          View profile
        </span>
      </motion.div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Dot indicator when collapsed (role badge)
// ---------------------------------------------------------------------------
function RoleBadge({ role }: { role: Role }) {
  const { open, animate } = useSidebar()
  const isStaff = hasMinRole(role, "STAFF")
  if (!isStaff) return null

  const label = hasMinRole(role, "DEVELOPER")
    ? "DEV"
    : hasMinRole(role, "ADMIN")
    ? "ADMIN"
    : "STAFF"

  return (
    <motion.div
      animate={{
        display: animate ? (open ? "flex" : "none") : "flex",
        opacity: animate ? (open ? 1 : 0) : 1,
      }}
      className="flex items-center gap-1.5 px-2 mb-1"
    >
      <span
        className="text-[9px] font-bold uppercase tracking-[0.22em] px-2 py-0.5 rounded-full"
        style={{
          background: "rgba(196,28,53,0.15)",
          color: "rgba(196,28,53,0.85)",
          border: "1px solid rgba(196,28,53,0.25)",
        }}
      >
        {label}
      </span>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Inner nav content (used by both desktop and mobile)
// ---------------------------------------------------------------------------
function NavContent({
  role,
  name,
  image,
}: {
  role: Role
  name: string
  image?: string | null
}) {
  const pathname = usePathname()
  const isStaff = hasMinRole(role, "STAFF")
  const isAdmin = hasMinRole(role, "ADMIN")

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <>
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <C3Logo />

        {/* Glow line under logo */}
        <div
          className="h-px mb-4 mx-2"
          style={{ background: "linear-gradient(90deg, rgba(196,28,53,0.4), rgba(59,130,246,0.2), transparent)" }}
          aria-hidden
        />

        {/* Role badge */}
        <RoleBadge role={role} />

        {/* Staff/Admin get the admin nav first */}
        {isStaff ? (
          <>
            <div className="flex flex-col gap-0.5">
              {STAFF_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  link={{
                    href: item.href,
                    label: item.label,
                    icon: <item.icon className="h-4 w-4 flex-shrink-0" />,
                  }}
                  active={isActive(item.href)}
                />
              ))}
              {isAdmin && ADMIN_EXTRA_NAV.map((item) => (
                <SidebarLink
                  key={item.href}
                  link={{
                    href: item.href,
                    label: item.label,
                    icon: <item.icon className="h-4 w-4 flex-shrink-0" />,
                  }}
                  active={isActive(item.href)}
                />
              ))}
            </div>

            <SectionLabel label="My Account" />
            <div className="flex flex-col gap-0.5">
              {USER_NAV.slice(0, -2).map((item) => (
                <SidebarLink
                  key={item.href + "-user"}
                  link={{
                    href: item.href,
                    label: item.label,
                    icon: <item.icon className="h-4 w-4 flex-shrink-0" />,
                  }}
                  active={isActive(item.href)}
                />
              ))}
              <SidebarLink
                link={{ href: "/roadmap", label: "Roadmap", icon: <Map className="h-4 w-4 flex-shrink-0" /> }}
                active={isActive("/roadmap")}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-0.5">
            {USER_NAV.map((item) => (
              <SidebarLink
                key={item.href}
                link={{
                  href: item.href,
                  label: item.label,
                  icon: <item.icon className="h-4 w-4 flex-shrink-0" />,
                }}
                active={isActive(item.href)}
              />
            ))}
          </div>
        )}
      </div>

      {/* User footer */}
      <div
        className="mt-auto pt-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <UserFooter name={name} image={image} />
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Exported component
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
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody
        className="border-r"
        style={{
          background: "var(--sidebar)",
          borderColor: "var(--sidebar-border)",
          minHeight: "calc(100vh - 4rem)",
        }}
      >
        <NavContent role={role} name={userName} image={userImage} />
      </SidebarBody>
    </Sidebar>
  )
}
