import { cn } from "@/lib/utils"
import { IconUser } from "@tabler/icons-react"

interface DashboardHeaderProps extends React.HTMLAttributes<HTMLElement> {
  heading: string
  text: string
  role?: "collector" | "recycler"
  name?: string
}

export function DashboardHeader({ className, heading, text, role, name, ...props }: DashboardHeaderProps) {
  const roleDisplay = role === "collector" ? "Collector" : role === "recycler" ? "Recycler" : undefined
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-white px-4 py-3",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {role && name ? (
            <>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <IconUser className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-gray-900">{name}</h1>
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