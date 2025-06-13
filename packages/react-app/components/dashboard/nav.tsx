import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon?: React.ReactNode
  }[]
}

export function Nav({ className, items, ...props }: NavProps) {
  const pathname = usePathname()

  return (
    <nav className="space-y-2.5" {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-4 rounded-xl pl-2 pr-4 py-3 text-sm font-bold transition-all duration-200",
            pathname === item.href
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm"
          )}
        >
          <span className={cn(
            "transition-transform duration-200",
            pathname === item.href ? "scale-110" : "group-hover:scale-105"
          )}>
            {item.icon}
          </span>
          <span className="tracking-wide font-extrabold">{item.title}</span>
        </Link>
      ))}
    </nav>
  )
} 