"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useState } from "react"
import type { Session } from "next-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, ShieldCheck, ShieldAlert, LogOut } from "lucide-react"

const ROLE_LABEL: Record<string, string> = {
  ADMIN:  "Admin",
  STAFF:  "Staff",
  PLAYER: "Player",
}

const ROLE_COLOR: Record<string, string> = {
  ADMIN:  "rgba(220,38,38,0.85)",
  STAFF:  "rgba(167,139,250,0.85)",
  PLAYER: "rgba(255,255,255,0.28)",
}

export function UserMenu({ session }: { session: Session }) {
  const { user } = session
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "?")

  const role = user.role ?? "PLAYER"

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative rounded-full focus:outline-none" aria-label="Open user menu">
          <motion.span
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{
              boxShadow: open
                ? "0 0 0 2px rgba(124,58,237,0.6), 0 0 16px rgba(124,58,237,0.3)"
                : "0 0 0 1.5px rgba(255,255,255,0.12)",
            }}
            transition={{ duration: 0.2 }}
          />
          <Avatar className="h-8 w-8 pointer-events-none">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback
              className="text-xs font-semibold"
              style={{
                background: "linear-gradient(135deg, rgba(124,58,237,0.4), rgba(6,182,212,0.3))",
                color: "rgba(255,255,255,0.85)",
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-52 p-0 overflow-hidden border-0"
        style={{
          background: "rgba(10,10,12,0.92)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          borderRadius: "14px",
        }}
      >
        {/* Top glow line */}
        <div
          className="h-px w-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 40%, rgba(6,182,212,0.4) 70%, transparent)" }}
          aria-hidden
        />

        {/* Profile header */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-4 py-3.5 font-normal">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                <AvatarFallback
                  className="text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(6,182,212,0.4))",
                    color: "rgba(255,255,255,0.9)",
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: "rgba(255,255,255,0.9)" }}>
                  {user.name ?? user.email}
                </p>
                <p className="text-[11px] font-medium mt-0.5" style={{ color: ROLE_COLOR[role] }}>
                  {ROLE_LABEL[role] ?? role}
                </p>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <div className="mx-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

        <DropdownMenuGroup className="p-1.5">
          <MenuItem
            icon={LayoutDashboard}
            label="Dashboard"
            onClick={() => { setOpen(false); router.push("/dashboard") }}
          />
          {(role === "STAFF" || role === "ADMIN") && (
            <MenuItem
              icon={ShieldCheck}
              label="Staff Panel"
              onClick={() => { setOpen(false); router.push("/staff") }}
              accent="violet"
            />
          )}
          {role === "ADMIN" && (
            <MenuItem
              icon={ShieldAlert}
              label="Admin Panel"
              onClick={() => { setOpen(false); router.push("/admin") }}
              accent="red"
            />
          )}
        </DropdownMenuGroup>

        <div className="mx-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />

        <DropdownMenuGroup className="p-1.5">
          <MenuItem
            icon={LogOut}
            label="Sign Out"
            onClick={() => signOut({ callbackUrl: "/" })}
            danger
          />
        </DropdownMenuGroup>

        <div className="h-1" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  accent,
  danger,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
  accent?: "violet" | "red"
  danger?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const iconColor = danger
    ? "rgba(220,38,38,0.8)"
    : accent === "violet"
    ? "rgba(167,139,250,0.85)"
    : accent === "red"
    ? "rgba(220,38,38,0.75)"
    : "rgba(255,255,255,0.35)"

  const textColor = danger
    ? (hovered ? "rgba(248,113,113,0.95)" : "rgba(220,38,38,0.75)")
    : hovered ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)"

  const bg = hovered
    ? danger
      ? "rgba(220,38,38,0.08)"
      : accent === "violet"
      ? "rgba(124,58,237,0.1)"
      : "rgba(255,255,255,0.05)"
    : "transparent"

  return (
    <DropdownMenuItem
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[9px] cursor-pointer focus:outline-none"
      style={{ background: bg, color: textColor, transition: "background 0.12s, color 0.12s" }}
    >
      <Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{
          color: hovered
            ? danger ? "rgba(248,113,113,0.9)" : accent === "violet" ? "rgba(167,139,250,0.9)" : "rgba(255,255,255,0.7)"
            : iconColor,
          transition: "color 0.12s",
        }}
      />
      <span className="text-sm font-medium">{label}</span>
    </DropdownMenuItem>
  )
}
