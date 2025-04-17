"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  IconLeaf,
  IconRecycle,
  IconTrees,
  IconDroplet,
  IconMedal,
  IconTrophy,
} from "@tabler/icons-react"

interface AchievementProps {
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  target: string
  current: string
}

function Achievement({
  title,
  description,
  icon,
  progress,
  target,
  current,
}: AchievementProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            {icon}
          </div>
          <div>
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{current} / {target}</span>
          </div>
          <Progress value={progress} />
        </div>
      </div>
    </Card>
  )
}

interface ImpactMetricProps {
  title: string
  value: string
  description: string
  icon: React.ReactNode
  trend?: string
}

function ImpactMetric({
  title,
  value,
  description,
  icon,
  trend,
}: ImpactMetricProps) {
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

export default function EnvironmentalImpactPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Environmental Impact"
        text="Track your contribution to environmental sustainability"
      />
      <div className="grid gap-6">
        {/* Impact Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <ImpactMetric
            icon={<IconLeaf className="h-6 w-6 text-primary" />}
            title="Carbon Footprint Reduced"
            value="2.5 tons"
            description="CO2 emissions prevented through recycling"
            trend="+0.5 tons this month"
          />
          <ImpactMetric
            icon={<IconRecycle className="h-6 w-6 text-primary" />}
            title="Materials Recycled"
            value="235 kg"
            description="Total weight of materials collected and recycled"
            trend="+45 kg this month"
          />
          <ImpactMetric
            icon={<IconTrees className="h-6 w-6 text-primary" />}
            title="Trees Saved"
            value="12"
            description="Equivalent trees saved through paper recycling"
            trend="+3 this month"
          />
          <ImpactMetric
            icon={<IconDroplet className="h-6 w-6 text-primary" />}
            title="Water Saved"
            value="5,000 L"
            description="Water saved through plastic and paper recycling"
            trend="+1,200 L this month"
          />
        </div>

        {/* Achievements */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Achievements</h2>
                <p className="text-sm text-muted-foreground">
                  Track your progress towards sustainability goals
                </p>
              </div>
              <Badge variant="secondary">3 Active Goals</Badge>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Achievement
                icon={<IconMedal className="h-6 w-6 text-primary" />}
                title="Plastic Champion"
                description="Collect 100kg of plastic waste"
                progress={75}
                current="75kg"
                target="100kg"
              />
              <Achievement
                icon={<IconTrophy className="h-6 w-6 text-primary" />}
                title="E-Waste Warrior"
                description="Collect 50kg of electronic waste"
                progress={60}
                current="30kg"
                target="50kg"
              />
              <Achievement
                icon={<IconLeaf className="h-6 w-6 text-primary" />}
                title="Carbon Reducer"
                description="Reduce 5 tons of CO2 emissions"
                progress={50}
                current="2.5 tons"
                target="5 tons"
              />
            </div>
          </div>
        </Card>

        {/* Monthly Impact Summary */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Monthly Impact Summary</h2>
            <p className="text-sm text-muted-foreground">
              Your contribution to environmental sustainability this month
            </p>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <p className="font-medium">Plastic Waste Collected</p>
                  <p className="text-sm text-muted-foreground">45kg collected this month</p>
                </div>
                <Badge>+12% from last month</Badge>
              </div>
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <p className="font-medium">Paper Waste Recycled</p>
                  <p className="text-sm text-muted-foreground">30kg recycled this month</p>
                </div>
                <Badge>+8% from last month</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">E-Waste Processed</p>
                  <p className="text-sm text-muted-foreground">15kg processed this month</p>
                </div>
                <Badge>+15% from last month</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 