import { cn } from "@/lib/utils"
import { IconUser } from "@tabler/icons-react"

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  role: "collector" | "recycler"
  name: string
}

export function Header({ className, role, name, ...props }: HeaderProps) {
  const roleDisplay = role === "collector" ? "Collector" : "Recycler"
  
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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <IconUser className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-gray-900">{name}</h1>
            <p className="text-xs text-gray-500">{roleDisplay}</p>
          </div>
        </div>
      </div>
    </header>
  )
} 