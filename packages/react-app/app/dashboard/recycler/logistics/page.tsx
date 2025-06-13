"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconTruck,
  IconPackage,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconPlus,
} from "@tabler/icons-react"

interface PickupCardProps {
  id: string
  date: string
  time: string
  materials: {
    type: string
    quantity: string
  }[]
  location: string
  status: "Scheduled" | "In Transit" | "Completed" | "Cancelled"
  driver?: {
    name: string
    contact: string
  }
}

function PickupCard({
  id,
  date,
  time,
  materials,
  location,
  status,
  driver,
}: PickupCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{id}</h3>
              <Badge
                variant={
                  status === "Scheduled"
                    ? "secondary"
                    : status === "In Transit"
                    ? "default"
                    : status === "Completed"
                    ? "outline"
                    : "destructive"
                }
              >
                {status}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconCalendar className="h-4 w-4" />
                <span>{date}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconClock className="h-4 w-4" />
                <span>{time}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            {status === "Scheduled" && (
              <Button variant="outline" size="sm" className="text-red-600">
                Cancel
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <IconMapPin className="h-4 w-4" />
            <span>{location}</span>
          </div>
          <div className="mt-4">
            <p className="text-sm font-medium">Materials:</p>
            <div className="mt-1 space-y-1">
              {materials.map((material, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <IconPackage className="h-4 w-4" />
                  <span>
                    {material.type} • {material.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {driver && (
            <div className="mt-4 rounded-lg border p-3">
              <p className="text-sm font-medium">Driver Information</p>
              <p className="text-sm text-muted-foreground">
                {driver.name} • {driver.contact}
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function LogisticsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Logistics Scheduling"
        text="Schedule and manage material pickups"
      />
      <div className="grid gap-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconTruck className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Today&apos;s Pickups</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">2 completed</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Scheduled</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">8</p>
              <p className="text-sm text-muted-foreground">Next 7 days</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconPackage className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Total Weight</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">1,250kg</p>
              <p className="text-sm text-muted-foreground">Pending pickup</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconClock className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Avg. Wait Time</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">1.5 days</p>
              <p className="text-sm text-muted-foreground">From request to pickup</p>
            </div>
          </Card>
        </div>

        {/* Pickup Schedule */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Pickup Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  Manage scheduled pickups and deliveries
                </p>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                Schedule Pickup
              </Button>
            </div>
            <Tabs defaultValue="upcoming" className="mt-6">
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="in-transit">In Transit</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
              <TabsContent value="upcoming" className="mt-4 space-y-4">
                <PickupCard
                  id="PCK-2023-0045"
                  date="2023-03-22"
                  time="09:00 AM"
                  materials={[
                    { type: "PET Plastic", quantity: "500kg" },
                    { type: "HDPE", quantity: "300kg" },
                  ]}
                  location="Storage Bay A"
                  status="Scheduled"
                  driver={{
                    name: "John Smith",
                    contact: "+254 712 345 678",
                  }}
                />
                <PickupCard
                  id="PCK-2023-0046"
                  date="2023-03-23"
                  time="02:00 PM"
                  materials={[
                    { type: "Metal", quantity: "450kg" },
                  ]}
                  location="Storage Bay D"
                  status="Scheduled"
                />
              </TabsContent>
              <TabsContent value="in-transit" className="mt-4 space-y-4">
                <PickupCard
                  id="PCK-2023-0044"
                  date="2023-03-21"
                  time="11:00 AM"
                  materials={[
                    { type: "E-Waste", quantity: "200kg" },
                  ]}
                  location="Storage Bay C"
                  status="In Transit"
                  driver={{
                    name: "David Kamau",
                    contact: "+254 723 456 789",
                  }}
                />
              </TabsContent>
              <TabsContent value="completed" className="mt-4 space-y-4">
                <PickupCard
                  id="PCK-2023-0043"
                  date="2023-03-20"
                  time="10:00 AM"
                  materials={[
                    { type: "Mixed Plastic", quantity: "400kg" },
                  ]}
                  location="Storage Bay B"
                  status="Completed"
                  driver={{
                    name: "Sarah Wanjiku",
                    contact: "+254 734 567 890",
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 