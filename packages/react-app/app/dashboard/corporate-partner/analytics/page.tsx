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
import { IconBox, IconStore, IconShield, IconChart } from "@/components/ui/icons"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AnalyticsPage() {
  const router = useRouter()
  const { role, isLoading } = useRole()

  useEffect(() => {
    if (!isLoading && role !== 'corporate_partner') {
      router.push('/dashboard')
    }
  }, [role, isLoading, router])

  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Analytics Dashboard"
          text="Track your recycling impact and performance metrics"
        />
        <Card>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </Card>
      </DashboardShell>
    )
  }

  if (role !== 'corporate_partner') {
    return null
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analytics Dashboard"
        text="Track your recycling impact and performance metrics"
      />
      
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Waste Collected"
            value="1,234 kg"
            description="This month"
            icon={IconBox}
          />
          <MetricCard
            title="Collection Points"
            value="12"
            description="Active locations"
            icon={IconStore}
          />
          <MetricCard
            title="Verified Collections"
            value="98%"
            description="Success rate"
            icon={IconShield}
          />
          <MetricCard
            title="Environmental Impact"
            value="2.5 tons"
            description="CO₂ saved"
            icon={IconChart}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="impact">Impact</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Collection Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: 'Jan', value: 400 },
                        { name: 'Feb', value: 300 },
                        { name: 'Mar', value: 600 },
                        { name: 'Apr', value: 800 },
                        { name: 'May', value: 700 },
                        { name: 'Jun', value: 900 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
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

          <TabsContent value="collections" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Collection Points Performance</CardTitle>
                  <Select defaultValue="month">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Last 7 days</SelectItem>
                      <SelectItem value="month">Last 30 days</SelectItem>
                      <SelectItem value="quarter">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Point A', value: 400 },
                        { name: 'Point B', value: 300 },
                        { name: 'Point C', value: 600 },
                        { name: 'Point D', value: 800 },
                        { name: 'Point E', value: 700 },
                      ]}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="impact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">CO₂ Emissions Saved</p>
                      <p className="text-2xl font-bold">2.5 tons</p>
                    </div>
                    <Badge variant="secondary">+12% from last month</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Water Saved</p>
                      <p className="text-2xl font-bold">15,000 L</p>
                    </div>
                    <Badge variant="secondary">+8% from last month</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Landfill Space Saved</p>
                      <p className="text-2xl font-bold">3.2 m³</p>
                    </div>
                    <Badge variant="secondary">+15% from last month</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
    </DashboardShell>
  )
} 