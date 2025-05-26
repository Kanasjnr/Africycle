import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  IconBox,
  IconCamera,
  IconChartBar,
  IconClipboardList,
  IconClipboardCheck,
  IconCoin,
  IconFileText,
  IconHome,
  IconLeaf,
  IconMap,
  IconMap2,
  IconPackage,
  IconQrcode,
  IconRecycle,
  IconShoppingCart,
  IconShield,
  IconTimeline,
  IconTruck,
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

export const collectorNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/collector",
    icon: <IconHome className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "QR Scanner",
    href: "/dashboard/collector/scanner",
    icon: <IconQrcode className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Collection Map",
    href: "/dashboard/collector/map",
    icon: <IconMap className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Photo Verification",
    href: "/dashboard/collector/verification",
    icon: <IconCamera className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Digital Wallet",
    href: "/dashboard/collector/wallet",
    icon: <IconWallet className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Collection History",
    href: "/dashboard/collector/history",
    icon: <IconTimeline className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Environmental Impact",
    href: "/dashboard/collector/impact",
    icon: <IconLeaf className="h-5 w-5 stroke-[2]" />,
  },
]

export const collectionPointNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/collection-point",
    icon: <IconHome className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Material Verification",
    href: "/dashboard/collection-point/verification",
    icon: <IconClipboardCheck className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Inventory",
    href: "/dashboard/collection-point/inventory",
    icon: <IconPackage className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Logistics",
    href: "/dashboard/collection-point/logistics",
    icon: <IconTruck className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Performance",
    href: "/dashboard/collection-point/performance",
    icon: <IconChartBar className="h-5 w-5 stroke-[2]" />,
  },
]

export const recyclerNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/recycler",
    icon: <IconHome className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Material Tracking",
    href: "/dashboard/recycler/tracking",
    icon: <IconBox className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Processing",
    href: "/dashboard/recycler/processing",
    icon: <IconClipboardList className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Marketplace",
    href: "/dashboard/recycler/marketplace",
    icon: <IconShoppingCart className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Compliance",
    href: "/dashboard/recycler/compliance",
    icon: <IconShield className="h-5 w-5 stroke-[2]" />,
  },
]

export const corporatePartnerNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard/corporate-partner",
    icon: <IconHome className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Supply Chain",
    href: "/dashboard/corporate-partner/supply-chain",
    icon: <IconBox className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Impact Dashboard",
    href: "/dashboard/corporate-partner/impact",
    icon: <IconChartBar className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "Credit Marketplace",
    href: "/dashboard/corporate-partner/marketplace",
    icon: <IconShoppingCart className="h-5 w-5 stroke-[2]" />,
  },
  {
    title: "ESG Reporting",
    href: "/dashboard/corporate-partner/reporting",
    icon: <IconFileText className="h-5 w-5 stroke-[2]" />,
  },
] 