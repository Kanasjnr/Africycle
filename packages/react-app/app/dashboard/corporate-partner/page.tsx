"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  IconRecycle,
  IconLeaf,
  IconCertificate,
  IconTrophy,
  IconChartBar,
  IconUsers,
} from "@tabler/icons-react"

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

interface CertificationProps {
  title: string
  issuer: string
  date: string
  status: "Active" | "Pending" | "Expired"
  validUntil: string
}

function Certification({
  title,
  issuer,
  date,
  status,
  validUntil,
}: CertificationProps) {
  return (
    <div className="border-b py-4 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{title}</h3>
            <Badge
              variant={
                status === "Active"
                  ? "default"
                  : status === "Pending"
                  ? "secondary"
                  : "destructive"
              }
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Issued by {issuer} on {date}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">Valid until {validUntil}</p>
      </div>
    </div>
  )
}

export default function CorporatePartnerDashboard() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Corporate Partner Dashboard"
        text="Monitor your sustainability impact and certifications"
      />
      <div className="grid gap-6">
        {/* Impact Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <ImpactMetric
            icon={<IconRecycle className="h-6 w-6 text-primary" />}
            title="Total Waste Recycled"
            value="1,250 tons"
            description="Total waste recycled through our program"
            trend="+125 tons this quarter"
          />
          <ImpactMetric
            icon={<IconLeaf className="h-6 w-6 text-primary" />}
            title="Carbon Offset"
            value="450 tons"
            description="CO2 emissions prevented"
            trend="+45 tons this quarter"
          />
          <ImpactMetric
            icon={<IconCertificate className="h-6 w-6 text-primary" />}
            title="Active Certifications"
            value="4"
            description="Environmental certifications"
            trend="+1 this quarter"
          />
          <ImpactMetric
            icon={<IconUsers className="h-6 w-6 text-primary" />}
            title="Community Impact"
            value="250+"
            description="Waste collectors supported"
            trend="+25 this quarter"
          />
        </div>

        {/* Sustainability Goals */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Sustainability Goals</h2>
                <p className="text-sm text-muted-foreground">
                  Progress towards annual sustainability targets
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconTrophy className="h-4 w-4" />
                On Track
              </Badge>
            </div>
            <div className="mt-6 space-y-6">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Waste Reduction Target</h3>
                  <span className="text-sm text-muted-foreground">1,250/2,000 tons</span>
                </div>
                <Progress value={62.5} />
                <p className="mt-2 text-sm text-muted-foreground">
                  62.5% of annual target achieved
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Carbon Neutrality</h3>
                  <span className="text-sm text-muted-foreground">450/800 tons CO2</span>
                </div>
                <Progress value={56} />
                <p className="mt-2 text-sm text-muted-foreground">
                  56% of carbon offset target achieved
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Community Engagement</h3>
                  <span className="text-sm text-muted-foreground">250/300 collectors</span>
                </div>
                <Progress value={83} />
                <p className="mt-2 text-sm text-muted-foreground">
                  83% of community support target achieved
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Certifications */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Certifications</h2>
                <p className="text-sm text-muted-foreground">
                  Environmental and sustainability certifications
                </p>
              </div>
              <Badge variant="secondary" className="flex items-center gap-1">
                <IconChartBar className="h-4 w-4" />
                4 Active
              </Badge>
            </div>
            <div className="mt-6 divide-y">
              <Certification
                title="ISO 14001:2015"
                issuer="International Organization for Standardization"
                date="Jan 15, 2023"
                status="Active"
                validUntil="Jan 15, 2024"
              />
              <Certification
                title="Green Business Certification"
                issuer="Environmental Protection Agency"
                date="Mar 1, 2023"
                status="Active"
                validUntil="Mar 1, 2024"
              />
              <Certification
                title="Sustainable Supply Chain"
                issuer="Global Sustainability Initiative"
                date="Feb 10, 2023"
                status="Pending"
                validUntil="N/A"
              />
              <Certification
                title="Carbon Trust Standard"
                issuer="Carbon Trust"
                date="Dec 20, 2022"
                status="Active"
                validUntil="Dec 20, 2023"
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 