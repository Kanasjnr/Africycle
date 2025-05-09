"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  IconTrendingUp,
  IconScale,
  IconClock,
  IconStar,
  IconAward,
  IconUsers,
} from "@tabler/icons-react"

interface RankingProps {
  rank: number
  name: string
  score: number
  isCurrentUser?: boolean
}

function RankingItem({ rank, name, score, isCurrentUser }: RankingProps) {
  return (
    <div
      className={`flex items-center justify-between border-b py-4 last:border-0 ${
        isCurrentUser ? "bg-muted/50 -mx-6 px-6" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <span className="text-sm font-medium">#{rank}</span>
        </div>
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {score.toLocaleString()} points
          </p>
        </div>
      </div>
      {isCurrentUser && <Badge>You</Badge>}
    </div>
  )
}

interface PerformanceMetricProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
}

function PerformanceMetric({
  title,
  value,
  description,
  icon,
  trend,
}: PerformanceMetricProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold">{value}</h3>
              {trend && <Badge variant="secondary">{trend}</Badge>}
            </div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function PerformanceStatsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Performance Stats"
        text="Track your collection performance and rankings"
      />
      <div className="grid gap-6">
        {/* Performance Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <PerformanceMetric
            icon={<IconTrendingUp className="h-6 w-6 text-primary" />}
            title="Collection Efficiency"
            value="92%"
            description="Average collection completion rate"
            trend="+5% this month"
          />
          <PerformanceMetric
            icon={<IconScale className="h-6 w-6 text-primary" />}
            title="Average Collection"
            value="7.5 kg"
            description="Average weight per collection"
            trend="+1.2 kg this month"
          />
          <PerformanceMetric
            icon={<IconClock className="h-6 w-6 text-primary" />}
            title="Response Time"
            value="25 min"
            description="Average time to reach collection point"
            trend="-5 min this month"
          />
          <PerformanceMetric
            icon={<IconStar className="h-6 w-6 text-primary" />}
            title="Rating"
            value="4.8/5.0"
            description="Average rating from recyclers"
            trend="+0.2 this month"
          />
        </div>

        {/* Collector Rankings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Top Collectors</h2>
                <p className="text-sm text-muted-foreground">
                  Rankings based on collection performance
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconAward className="h-4 w-4" />
                Rank #4
              </Badge>
            </div>
            <div className="mt-6">
              <RankingItem
                rank={1}
                name="Sarah Kamau"
                score={2850}
              />
              <RankingItem
                rank={2}
                name="David Omondi"
                score={2720}
              />
              <RankingItem
                rank={3}
                name="Lucy Wanjiku"
                score={2680}
              />
              <RankingItem
                rank={4}
                name="John Doe"
                score={2540}
                isCurrentUser
              />
              <RankingItem
                rank={5}
                name="Peter Maina"
                score={2490}
              />
            </div>
          </div>
        </Card>

        {/* Performance Insights */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Performance Insights</h2>
                <p className="text-sm text-muted-foreground">
                  Key metrics and achievements this month
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconUsers className="h-4 w-4" />
                Top 10%
              </Badge>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Collection Target Progress</h3>
                  <span className="text-sm text-muted-foreground">235/300 kg</span>
                </div>
                <Progress value={78} />
                <p className="mt-2 text-sm text-muted-foreground">
                  78% of monthly target achieved
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Verification Success Rate</h3>
                  <span className="text-sm text-muted-foreground">28/31 collections</span>
                </div>
                <Progress value={90} />
                <p className="mt-2 text-sm text-muted-foreground">
                  90% verification success rate
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">On-Time Collection Rate</h3>
                  <span className="text-sm text-muted-foreground">29/31 collections</span>
                </div>
                <Progress value={94} />
                <p className="mt-2 text-sm text-muted-foreground">
                  94% collections completed on time
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 