"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/hooks/use-role"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { MetricCard } from "@/components/dashboard/metric-card"
import { IconBox, IconRefresh, IconStore, IconShield, IconChart } from "@/components/ui/icons"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { RecyclerOverview } from "@/components/dashboard/recycler/overview"
import { MaterialProcessing } from "@/components/dashboard/recycler/material-processing"
import { QuickActions } from "@/components/dashboard/recycler/quick-actions"
import { MaterialTrackingOverview } from "@/components/dashboard/recycler/tracking/overview"
import { MaterialTrackingList } from "@/components/dashboard/recycler/tracking/tracking-list"
import { ProcessingOverview } from "@/components/dashboard/recycler/processing/overview"
import { ProcessingDocsList } from "@/components/dashboard/recycler/processing/docs-list"
import { MarketplaceOverview } from "@/components/dashboard/recycler/marketplace/overview"
import { MarketplaceListings } from "@/components/dashboard/recycler/marketplace/listings"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconDownload,
  IconFilter,
  IconChartPie,
  IconChartBar,
  IconChartLine,
  IconMap,
} from "@tabler/icons-react"

// Sample data for charts
const monthlyData = [
  { month: "Jan", plasticFootprint: 1200, recycledContent: 800, carbonReduction: 500, waterConservation: 300 },
  { month: "Feb", plasticFootprint: 1100, recycledContent: 850, carbonReduction: 550, waterConservation: 350 },
  { month: "Mar", plasticFootprint: 1000, recycledContent: 900, carbonReduction: 600, waterConservation: 400 },
  { month: "Apr", plasticFootprint: 950, recycledContent: 950, carbonReduction: 650, waterConservation: 450 },
  { month: "May", plasticFootprint: 900, recycledContent: 1000, carbonReduction: 700, waterConservation: 500 },
  { month: "Jun", plasticFootprint: 850, recycledContent: 1050, carbonReduction: 750, waterConservation: 550 },
]

const materialData = [
  { material: "PET", recycled: 450, virgin: 550 },
  { material: "HDPE", recycled: 350, virgin: 650 },
  { material: "PP", recycled: 250, virgin: 750 },
  { material: "LDPE", recycled: 200, virgin: 800 },
  { material: "MLP", recycled: 150, virgin: 850 },
]

interface AnalyticCardProps {
  title: string
  value: string
  description: string
  chart: React.ReactNode
}

function AnalyticCard({ title, value, description, chart }: AnalyticCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{description}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-[200px]">
          {/* Placeholder for chart */}
          <div className="flex h-full items-center justify-center rounded-lg border bg-muted/50">
            {chart}
          </div>
        </div>
      </div>
    </Card>
  )
}

interface ReportProps {
  title: string
  description: string
  date: string
  type: string
  size: string
}

function Report({ title, description, date, type, size }: ReportProps) {
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-sm text-muted-foreground">
          Generated on {date} • {type} • {size}
        </p>
      </div>
      <Button variant="outline" size="sm">
        <IconDownload className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  )
}

export default function RecyclerDashboardPage() {
  const router = useRouter()
  const { role, isLoading } = useRole()

  useEffect(() => {
    if (!isLoading && role !== "corporate_partner") {
      router.push("/dashboard")
    }
  }, [role, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (role !== "corporate_partner") {
    return null
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Recycler Interface"
        text="Track incoming materials, document processing, and manage marketplace listings"
      />
      <div className="grid gap-6">
        <RecyclerOverview />
        <div className="grid gap-6 md:grid-cols-2">
          <MaterialProcessing />
          <QuickActions />
        </div>
        <MaterialTrackingOverview />
        <MaterialTrackingList />
        <ProcessingOverview />
        <ProcessingDocsList />
        <MarketplaceOverview />
        <MarketplaceListings />
      </div>
    </DashboardShell>
  )
} 