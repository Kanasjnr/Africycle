"use client"

import { useEffect } from "react"
import { useRole } from "@/hooks/use-role"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconClipboardCheck,
  IconPackage,
  IconTruck,
  IconUsers,
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react"

interface MetricCardProps {
  title: string
  value: string
  description: string
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  icon: typeof IconPackage
}

function MetricCard({ title, value, description, trend, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        {trend && (
          <div className="mt-2 flex items-center text-sm">
            {trend.positive ? (
              <IconArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
            ) : (
              <IconArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
            )}
            <span
              className={trend.positive ? "text-green-500" : "text-red-500"}
            >
              {trend.value}%
            </span>
            <span className="ml-1 text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

interface QuickActionProps {
  title: string
  href: string
  icon: typeof IconPackage
}

function QuickAction({ title, href, icon: Icon }: QuickActionProps) {
  return (
    <Button variant="outline" className="h-auto flex-col gap-2 p-4" asChild>
      <a href={href}>
        <Icon className="h-5 w-5" />
        <span>{title}</span>
      </a>
    </Button>
  )
}

export default function CollectionPointDashboard() {
  const { role, isLoading } = useRole()

  // Add debugging
  useEffect(() => {
    console.log("Collection Point Dashboard - Role:", role)
    console.log("Collection Point Dashboard - Loading:", isLoading)
  }, [role, isLoading])

  if (isLoading) {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Collection Point"
          text="Loading dashboard..."
        />
        <Card>
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
          </div>
        </Card>
      </DashboardShell>
    )
  }

  if (role !== "collection_point") {
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Access Denied"
          text="You do not have permission to access this dashboard"
        />
        <Card>
          <div className="p-6 text-center">
            <p className="text-muted-foreground">
              Current role: {role || "Not set"}
            </p>
            <p className="text-muted-foreground mt-2">
              Please ensure you are logged in with a collection point account.
            </p>
          </div>
        </Card>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collection Point"
        text="Verify materials, track inventory, and manage logistics"
      />
      <div className="grid gap-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            icon={IconClipboardCheck}
            title="Pending Verification"
            value="12"
            description="Collections awaiting verification"
            trend={{
              value: 3,
              label: "from last month",
              positive: false,
            }}
          />
          <MetricCard
            icon={IconPackage}
            title="Current Inventory"
            value="1,250kg"
            description="Total waste in inventory"
            trend={{
              value: 15,
              label: "from last month",
              positive: true,
            }}
          />
          <MetricCard
            icon={IconTruck}
            title="Scheduled Pickups"
            value="5"
            description="Logistics pickups scheduled"
            trend={{
              value: 2,
              label: "from last month",
              positive: true,
            }}
          />
          <MetricCard
            icon={IconUsers}
            title="Top Collectors"
            value="24"
            description="Active collectors this month"
            trend={{
              value: 8,
              label: "from last month",
              positive: true,
            }}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Inventory by Waste Type */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Inventory by Waste Type</h2>
                  <p className="text-sm text-muted-foreground">
                    Current inventory levels by waste category
                  </p>
                </div>
              </div>
              <div className="mt-4 h-[200px] w-full">
                {/* Chart placeholder - To be implemented */}
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Chart coming soon</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <div>
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">
                  Common tasks for collection points
                </p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <QuickAction
                  title="Verify Materials"
                  href="/dashboard/collection-point/verification"
                  icon={IconClipboardCheck}
                />
                <QuickAction
                  title="Manage Inventory"
                  href="/dashboard/collection-point/inventory"
                  icon={IconPackage}
                />
                <QuickAction
                  title="Schedule Logistics"
                  href="/dashboard/collection-point/logistics"
                  icon={IconTruck}
                />
                <QuickAction
                  title="View Performance"
                  href="/dashboard/collection-point/performance"
                  icon={IconUsers}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Verification Queue */}
        <Card>
          <div className="p-6">
            <Tabs defaultValue="pending">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Pending Verification</h2>
                  <p className="text-sm text-muted-foreground">
                    Recent material collections awaiting verification
                  </p>
                </div>
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="inventory">Current Inventory</TabsTrigger>
                  <TabsTrigger value="logistics">Logistics</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="pending" className="mt-4">
                <div className="space-y-4">
                  {/* Verification items will be mapped here */}
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">COL-2023-0123</span>
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                            Pending
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          John Doe • Plastic • 5kg
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Reject
                        </Button>
                        <Button size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 