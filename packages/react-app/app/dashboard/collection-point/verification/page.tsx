"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconClock,
  IconClipboardCheck,
} from "@tabler/icons-react"

interface VerificationItemProps {
  id: string
  collector: string
  material: string
  weight: string
  date: string
  location: string
  waitingTime: string
}

function VerificationItem({
  id,
  collector,
  material,
  weight,
  date,
  location,
  waitingTime,
}: VerificationItemProps) {
  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
          <div className="flex h-full items-center justify-center">
            <IconClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{id}</h3>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Collector: {collector}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{waitingTime}</span>
            </div>
          </div>
          <div className="grid gap-1 text-sm">
            <div className="grid grid-cols-3">
              <div>
                <p className="text-muted-foreground">Material</p>
                <p className="font-medium">{material}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">{weight}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{location}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">View Details</Button>
            <Button variant="outline" className="text-red-600 hover:text-red-600">
              <IconX className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button>
              <IconCheck className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  color?: string
}

function StatCard({ title, value, description, color = "text-foreground" }: StatCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

interface GuidelineProps {
  number: string
  title: string
  description: string
}

function Guideline({ number, title, description }: GuidelineProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">{number}.</span>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function MaterialVerificationPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Material Verification"
        text="Verify collected materials from waste collectors"
      />
      <div className="grid gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Verification Queue</h2>
                <p className="text-sm text-muted-foreground">
                  Pending material verifications
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                  <IconSearch className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="border-0 p-0 focus-visible:ring-0"
                  />
                </div>
                <Button variant="outline">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="text-sm">
                Pending (12)
              </Button>
              <Button variant="outline" className="text-sm">
                Verified (28)
              </Button>
              <Button variant="outline" className="text-sm">
                Rejected (5)
              </Button>
            </div>
            <div className="mt-6 space-y-6">
              <VerificationItem
                id="COL-2023-0123"
                collector="John Doe"
                material="Plastic"
                weight="5kg"
                date="2023-03-20"
                location="Nairobi Central"
                waitingTime="2 hours"
              />
              <VerificationItem
                id="COL-2023-0124"
                collector="Jane Smith"
                material="E-Waste"
                weight="3kg"
                date="2023-03-19"
                location="Westlands"
                waitingTime="2 hours"
              />
              <VerificationItem
                id="COL-2023-0125"
                collector="Robert Johnson"
                material="Metal"
                weight="7kg"
                date="2023-03-18"
                location="Eastleigh"
                waitingTime="2 hours"
              />
            </div>
            <div className="mt-6 flex items-center justify-between">
              <Button variant="outline">Previous</Button>
              <span className="text-sm text-muted-foreground">Page 1 of 3</span>
              <Button variant="outline">Next</Button>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Verification Statistics */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold">Verification Statistics</h2>
              <p className="text-sm text-muted-foreground">
                Overview of material verification activity
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <StatCard
                  title="Pending"
                  value="12"
                  description="Collections"
                  color="text-yellow-600"
                />
                <StatCard
                  title="Verified Today"
                  value="8"
                  description="Collections"
                  color="text-green-600"
                />
                <StatCard
                  title="Rejected Today"
                  value="2"
                  description="Collections"
                  color="text-red-600"
                />
                <StatCard
                  title="Avg. Response Time"
                  value="1.5h"
                  description="Per verification"
                />
              </div>
            </div>
          </Card>

          {/* Verification Guidelines */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold">Verification Guidelines</h2>
              <p className="text-sm text-muted-foreground">
                Standard procedures for material verification
              </p>
              <div className="mt-6 space-y-4">
                <Guideline
                  number="1"
                  title="Check Photo Evidence"
                  description="Verify that before and after photos clearly show the collected waste"
                />
                <Guideline
                  number="2"
                  title="Confirm Material Type"
                  description="Ensure the material type matches what is visible in the photos"
                />
                <Guideline
                  number="3"
                  title="Validate Weight"
                  description="Check that the claimed weight is reasonable for the amount shown"
                />
                <Guideline
                  number="4"
                  title="Provide Feedback"
                  description="Always include constructive feedback, especially for rejections"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
} 