import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  IconBox,
  IconCamera,
  IconChartBar,
  IconClipboardList,
  IconCoin,
  IconHome,
  IconLeaf,
  IconMap2,
  IconQrcode,
  IconRecycle,
  IconShoppingCart,
  IconTimeline,
  IconWallet,
  IconX,
} from "@tabler/icons-react"

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
    <nav className="space-y-1" {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname === item.href
              ? "bg-gray-100 text-gray-900"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          {item.icon}
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

export const collectorNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/collector",
    icon: <IconHome className="h-5 w-5" />,
  },
  {
    title: "QR Scanner",
    href: "/dashboard/collector/scanner",
    icon: <IconQrcode className="h-5 w-5" />,
  },
  {
    title: "Collection Map",
    href: "/dashboard/collector/map",
    icon: <IconMap2 className="h-5 w-5" />,
  },
  {
    title: "Photo Verification",
    href: "/dashboard/collector/verification",
    icon: <IconCamera className="h-5 w-5" />,
  },
  {
    title: "Digital Wallet",
    href: "/dashboard/collector/wallet",
    icon: <IconWallet className="h-5 w-5" />,
  },
  {
    title: "Collection History",
    href: "/dashboard/collector/history",
    icon: <IconTimeline className="h-5 w-5" />,
  },
//   {
//     title: "Verified Collections",
//     href: "/dashboard/collector/verified",
//     icon: <IconClipboardList className="h-5 w-5" />,
//   },
//   {
//     title: "Rejected Collections",
//     href: "/dashboard/collector/rejected",
//     icon: <IconX className="h-5 w-5" />,
//   },
//   {
//     title: "Performance Stats",
//     href: "/dashboard/collector/stats",
//     icon: <IconChartBar className="h-5 w-5" />,
//   },
  {
    title: "Environmental Impact",
    href: "/dashboard/collector/impact",
    icon: <IconLeaf className="h-5 w-5" />,
  },
]

export const recyclerNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/recycler",
    icon: <IconHome className="h-5 w-5" />,
  },
  {
    title: "Material Tracking",
    href: "/dashboard/recycler/tracking",
    icon: <IconBox className="h-5 w-5" />,
  },
  {
    title: "Processing Documentation",
    href: "/dashboard/recycler/processing",
    icon: <IconClipboardList className="h-5 w-5" />,
  },
  {
    title: "Marketplace",
    href: "/dashboard/recycler/marketplace",
    icon: <IconShoppingCart className="h-5 w-5" />,
  },
] 