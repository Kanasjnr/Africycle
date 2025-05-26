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

// Remove incorrect recycler component imports
// import RecyclerOverview from "@/app/dashboard/recycler/page"
// import MaterialProcessing from "@/app/dashboard/recycler/processing/page"
// import MaterialTrackingOverview from "@/app/dashboard/recycler/tracking/page"
// import ProcessingOverview from "@/app/dashboard/recycler/processing/page"
// import MarketplaceOverview from "@/app/dashboard/recycler/marketplace/page"

export default function CorporatePartnerAnalyticsPage() {
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
        heading="Analytics Dashboard"
        text="Track supply chain metrics, environmental impact, and ESG performance"
      />
      <div className="grid gap-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={IconBox}
            title="Total Materials"
            value="15,250 kg"
            description="Materials collected this month"
            trend={{
              value: 12,
              label: "from last month",
              positive: true,
            }}
          />
          <MetricCard
            icon={IconChart}
            title="Environmental Impact"
            value="45.2 tons"
            description="CO2 emissions reduced"
            trend={{
              value: 8,
              label: "from last month",
              positive: true,
            }}
          />
          <MetricCard
            icon={IconStore}
            title="Collection Points"
            value="24"
            description="Active collection points"
            trend={{
              value: 3,
              label: "from last month",
              positive: true,
            }}
          />
          <MetricCard
            icon={IconShield}
            title="ESG Score"
            value="85%"
            description="Current ESG rating"
            trend={{
              value: 5,
              label: "from last month",
              positive: true,
            }}
          />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="supply-chain" className="space-y-4">
          <TabsList>
            <TabsTrigger value="supply-chain">Supply Chain</TabsTrigger>
            <TabsTrigger value="environmental">Environmental Impact</TabsTrigger>
            <TabsTrigger value="esg">ESG Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="supply-chain" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Supply Chain Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add supply chain analytics content */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="environmental" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add environmental impact analytics content */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="esg" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>ESG Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Add ESG metrics content */}
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
} 