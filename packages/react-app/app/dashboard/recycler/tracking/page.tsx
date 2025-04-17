"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { MetricCard } from "@/components/dashboard/metric-card"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MaterialTrackingPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Material Tracking"
        text="Track incoming materials and monitor processing status"
      />
      <div className="grid gap-6">
        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            title="Incoming Materials"
            value="850kg"
            trend={{ value: 12, label: "from last month", positive: true }}
          />
          <MetricCard
            title="Processing Queue"
            value="450kg"
            trend={{ value: 8, label: "from last month", positive: true }}
          />
          <MetricCard
            title="Processing Efficiency"
            value="92%"
            trend={{ value: 3, label: "from last quarter", positive: true }}
          />
        </div>

        {/* Material Tracking List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Material Tracking</h2>
                <p className="text-sm text-muted-foreground">
                  Track incoming and processing materials
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Filter</Button>
                <Button>New Delivery</Button>
              </div>
            </div>

            <Tabs defaultValue="incoming" className="mt-6">
              <TabsList>
                <TabsTrigger value="incoming">Incoming (5)</TabsTrigger>
                <TabsTrigger value="processing">Processing (8)</TabsTrigger>
                <TabsTrigger value="completed">Completed (12)</TabsTrigger>
              </TabsList>
              <TabsContent value="incoming" className="mt-4 space-y-4">
                <DeliveryCard
                  id="DEL-2023-0045"
                  date="2023-03-25"
                  time="10:00 AM"
                  source="Nairobi Central Collection Point"
                  materials={[
                    { type: "Plastic", weight: 250 },
                    { type: "Metal", weight: 100 }
                  ]}
                  status="In Transit"
                />
                <DeliveryCard
                  id="DEL-2023-0046"
                  date="2023-03-27"
                  time="2:00 PM"
                  source="Mombasa Hub Collection Point"
                  materials={[
                    { type: "E-Waste", weight: 200 }
                  ]}
                  status="Scheduled"
                />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}

interface DeliveryCardProps {
  id: string
  date: string
  time: string
  source: string
  materials: Array<{ type: string; weight: number }>
  status: string
}

function DeliveryCard({
  id,
  date,
  time,
  source,
  materials,
  status
}: DeliveryCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{id}</h3>
            <Badge variant={status === "In Transit" ? "default" : "secondary"}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {date} at {time}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium">Source</p>
        <p className="text-sm text-muted-foreground">{source}</p>
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium">Materials</p>
        <div className="mt-2 space-y-2">
          {materials.map((material) => (
            <div key={material.type} className="flex justify-between text-sm">
              <span>{material.type}</span>
              <span>{material.weight}kg</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline">Reschedule</Button>
        <Button>Track</Button>
      </div>
    </div>
  )
}