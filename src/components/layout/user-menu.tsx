"use client"

import { signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { Session } from "next-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu({ session }: { session: Session }) {
  const { user } = session
  const router = useRouter()

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user.email?.[0]?.toUpperCase() ?? "?")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <Avatar className="h-8 w-8 pointer-events-none">
          <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium truncate">{user.name ?? user.email}</p>
            <p className="text-xs text-muted-foreground">{user.role}</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            Dashboard
          </DropdownMenuItem>
          {(user.role === "STAFF" || user.role === "ADMIN") && (
            <DropdownMenuItem onClick={() => router.push("/staff")}>
              Staff Panel
            </DropdownMenuItem>
          )}
          {user.role === "ADMIN" && (
            <DropdownMenuItem onClick={() => router.push("/admin")}>
              Admin Panel
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-destructive cursor-pointer focus:text-destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
