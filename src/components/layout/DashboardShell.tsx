import { DashboardSidebar } from "./DashboardSidebar"
import type { Role } from "@/lib/roles"

interface DashboardShellProps {
  children: React.ReactNode
  role: Role
  userName: string
  userImage?: string | null
}

export function DashboardShell({ children, role, userName, userImage }: DashboardShellProps) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <DashboardSidebar role={role} userName={userName} userImage={userImage} />
      <main className="flex-1 min-w-0 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}
