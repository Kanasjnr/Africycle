"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  IconUsers,
  IconTrendingUp,
  IconScale,
  IconRecycle,
  IconSearch,
  IconFilter,
  IconArrowUpRight,
  IconArrowDownRight,
  IconStar,
} from "@tabler/icons-react"

interface CollectorCardProps {
  id: string
  name: string
  rating: number
  metrics: {
    collections: number
    weight: string
    reliability: number
    quality: number
  }
  status: "Active" | "Inactive"
  trend: {
    value: number
    label: string
    positive: boolean
  }
}

function CollectorCard({
  id,
  name,
  rating,
  metrics,
  status,
  trend,
}: CollectorCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{name}</h3>
              <Badge variant={status === "Active" ? "default" : "secondary"}>
                {status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">ID: {id}</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <IconStar
                key={i}
                className={`h-4 w-4 ${
                  i < rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Collections</p>
            <p className="text-lg font-medium">{metrics.collections}</p>
            <div className="mt-1 flex items-center text-sm">
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
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Weight</p>
            <p className="text-lg font-medium">{metrics.weight}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Reliability Score</span>
              <span className="font-medium">{metrics.reliability}%</span>
            </div>
            <Progress value={metrics.reliability} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Quality Score</span>
              <span className="font-medium">{metrics.quality}%</span>
            </div>
            <Progress value={metrics.quality} />
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">
            View Details
          </Button>
          <Button variant="outline" size="sm">
            Contact
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function PerformancePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collector Performance"
        text="Track and analyze collector metrics and performance"
      />
      <div className="grid gap-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconUsers className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Active Collectors</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">
                +3 from last month
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconTrendingUp className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Avg. Performance</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">85%</p>
              <p className="text-sm text-muted-foreground">
                Based on quality scores
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconScale className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Total Collections</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">1,250kg</p>
              <p className="text-sm text-muted-foreground">
                This month
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconRecycle className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Reliability Rate</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">92%</p>
              <p className="text-sm text-muted-foreground">
                On-time collections
              </p>
            </div>
          </Card>
        </div>

        {/* Collector List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Top Collectors</h2>
                <p className="text-sm text-muted-foreground">
                  Performance metrics for active collectors
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                  <IconSearch className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search collectors..."
                    className="border-0 p-0 focus-visible:ring-0"
                  />
                </div>
                <Button variant="outline">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            <div className="mt-6 space-y-6">
              <CollectorCard
                id="COL-2023-0001"
                name="John Doe"
                rating={4}
                metrics={{
                  collections: 45,
                  weight: "500kg",
                  reliability: 95,
                  quality: 88,
                }}
                status="Active"
                trend={{
                  value: 12,
                  label: "from last month",
                  positive: true,
                }}
              />
              <CollectorCard
                id="COL-2023-0002"
                name="Jane Smith"
                rating={5}
                metrics={{
                  collections: 52,
                  weight: "650kg",
                  reliability: 98,
                  quality: 92,
                }}
                status="Active"
                trend={{
                  value: 15,
                  label: "from last month",
                  positive: true,
                }}
              />
              <CollectorCard
                id="COL-2023-0003"
                name="Robert Johnson"
                rating={3}
                metrics={{
                  collections: 28,
                  weight: "320kg",
                  reliability: 85,
                  quality: 75,
                }}
                status="Active"
                trend={{
                  value: 5,
                  label: "from last month",
                  positive: false,
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 