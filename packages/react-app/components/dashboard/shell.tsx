import { Nav, recyclerNavItems, collectorNavItems } from "@/components/dashboard/nav"
import { IconBell, IconMoon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePathname } from "next/navigation"

interface DashboardShellProps {
  children?: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const isCollector = pathname?.startsWith("/dashboard/collector")

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex h-full flex-col border-r bg-white">
          <div className="flex flex-col gap-4 px-6 py-4">
            {/* Logo */}
            <div className="flex items-center gap-2 py-2">
              <div className="rounded-full bg-gray-900 p-1">
                <div className="h-6 w-6 rounded-full bg-white" />
              </div>
              <span className="text-lg font-semibold">{isCollector ? "Collector" : "Recycler"}</span>
            </div>

            {/* Navigation */}
            <Nav items={isCollector ? collectorNavItems : recyclerNavItems} />
          </div>

          {/* User */}
          <div className="mt-auto border-t bg-white px-6 py-4">
            <div className="flex items-center gap-3 rounded-lg border bg-gray-50 p-4">
              <Avatar>
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>{isCollector ? "JD" : "NR"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{isCollector ? "John Doe" : "Nairobi Recycling"}</p>
                <p className="text-xs text-muted-foreground">{isCollector ? "Collector" : "Recycler"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col pl-72">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b bg-white">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <IconBell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <IconMoon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 space-y-4 p-8 pt-6">{children}</main>
      </div>
    </div>
  )
} 