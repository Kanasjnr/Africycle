"use client"

import { cn } from "@/lib/utils"
import { IconUser } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

interface DashboardHeaderProps extends React.HTMLAttributes<HTMLElement> {
  heading: string
  text: string
  role?: "collector" | "recycler"
  name?: string
}

export function DashboardHeader({ className, heading, text, role, name, ...props }: DashboardHeaderProps) {
  const router = useRouter()
  const roleDisplay = role === "collector" ? "Collector" : role === "recycler" ? "Recycler" : undefined
  
  const handleProfileClick = () => {
    router.push("/dashboard/profile")
  }
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-white px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {role && name ? (
            <>
              <button
                onClick={handleProfileClick}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                title="View Profile"
              >
                <IconUser className="h-5 w-5 text-primary" />
              </button>
              <div className="cursor-pointer" onClick={handleProfileClick}>
                <h1 className="text-sm font-semibold text-gray-900 hover:text-primary transition-colors">{name}</h1>
                <p className="text-xs text-gray-500">{roleDisplay}</p>
              </div>
            </>
          ) : (
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{heading}</h1>
              <p className="text-sm text-gray-500">{text}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

// For backward compatibility
export { DashboardHeader as Header } 