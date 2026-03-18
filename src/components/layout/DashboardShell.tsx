import { DashboardSidebar, DashboardMobileHeader } from "./DashboardSidebar"
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
      {/* Desktop: collapsible sidebar (hidden on mobile) */}
      <DashboardSidebar role={role} userName={userName} userImage={userImage} />

      {/* Right column: mobile header bar + page content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar + slide-in drawer (hidden on md+) */}
        <DashboardMobileHeader role={role} userName={userName} userImage={userImage} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
