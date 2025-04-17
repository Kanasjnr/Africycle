"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconBox, IconCamera, IconMap2, IconWallet } from "@tabler/icons-react"
import { MetricCard } from "@/components/dashboard/metric-card"

export default function CollectorDashboard() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Mobile Collector"
        text="Manage your waste collections, track earnings, and view your impact"
      />
      <div className="grid gap-6">
        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Collected"
            value="235kg"
            trend={{ value: 12, label: "from last month", positive: true }}
            icon={<IconBox className="h-4 w-4" />}
          />
          <MetricCard
            title="Earnings"
            value="$120"
            trend={{ value: 8, label: "from last month", positive: true }}
            icon={<IconWallet className="h-4 w-4" />}
          />
          <MetricCard
            title="Pending Verification"
            value="3"
            trend={{ value: 2, label: "from last month", positive: false }}
            icon={<IconCamera className="h-4 w-4" />}
          />
          <MetricCard
            title="Verified Collections"
            value="28"
            trend={{ value: 15, label: "from last month", positive: true }}
            icon={<IconBox className="h-4 w-4" />}
          />
        </div>

        {/* Collection History */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Collection History</h2>
            <p className="text-sm text-muted-foreground">
              Your waste collection history over time
            </p>
            <div className="mt-4 h-[200px] w-full">
              <p className="text-sm text-muted-foreground text-center py-8">
                Collection history chart will appear here
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">
              Common tasks for waste collectors
            </p>
            <div className="mt-4 grid gap-4">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/collector/scanner"}
              >
                <IconBox className="mr-2 h-4 w-4" />
                Scan QR Code
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/collector/map"}
              >
                <IconMap2 className="mr-2 h-4 w-4" />
                View Collection Map
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/collector/verification"}
              >
                <IconCamera className="mr-2 h-4 w-4" />
                Upload Verification Photo
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.location.href = "/dashboard/collector/wallet"}
              >
                <IconWallet className="mr-2 h-4 w-4" />
                View Wallet
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 