import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  IconHome,
  IconCamera,
  IconMap,
  IconWallet,
  IconClipboardCheck,
  IconPackage,
  IconShoppingCart,
} from "@tabler/icons-react"

interface BottomNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ReactNode
  }[]
}

export function BottomNav({ className, items, ...props }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 border-t bg-white px-2 py-2",
        className
      )} 
      {...props}
    >
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200",
              pathname === item.href
                ? "text-primary"
                : "text-gray-600 hover:text-gray-900"
            )}
          >
            <span className={cn(
              "transition-transform duration-200",
              pathname === item.href ? "scale-110" : ""
            )}>
              {item.icon}
            </span>
            <span>{item.title}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}

export const collectorNavItems = [
  {
    title: "Home",
    href: "/dashboard/collector",
    icon: <IconHome className="h-6 w-6 stroke-[1.5]" />,
  },
  {
    title: "Verify",
    href: "/dashboard/collector/verification",
    icon: <IconCamera className="h-6 w-6 stroke-[1.5]" />,
  },
  {
    title: "Map",
    href: "/dashboard/collector/map",
    icon: <IconMap className="h-6 w-6 stroke-[1.5]" />,
  },
  {
    title: "Wallet",
    href: "/dashboard/collector/wallet",
    icon: <IconWallet className="h-6 w-6 stroke-[1.5]" />,
  },
]

export const recyclerNavItems = [
  {
    title: "Home",
    href: "/dashboard/recycler",
    icon: <IconHome className="h-6 w-6 stroke-[1.5]" />,
  },
  {
    title: "Verify",
    href: "/dashboard/recycler/verification",
    icon: <IconClipboardCheck className="h-6 w-6 stroke-[1.5]" />,
  },
  {
    title: "Inventory",
    href: "/dashboard/recycler/inventory",
    icon: <IconPackage className="h-6 w-6 stroke-[1.5]" />,
  },
  {
    title: "Market",
    href: "/dashboard/recycler/marketplace",
    icon: <IconShoppingCart className="h-6 w-6 stroke-[1.5]" />,
  },
] 