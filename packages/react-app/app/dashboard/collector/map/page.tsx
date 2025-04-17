"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconNavigation } from "@tabler/icons-react"

interface CollectionPointProps {
  name: string
  address: string
  distance: string
  status: "Open" | "Closed"
  materials: string[]
}

function CollectionPoint({
  name,
  address,
  distance,
  status,
  materials,
}: CollectionPointProps) {
  return (
    <div className="border-b py-4 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            <Badge variant={status === "Open" ? "default" : "secondary"}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{address}</p>
          <p className="text-sm text-muted-foreground">{distance}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {materials.map((material) => (
          <Badge key={material} variant="outline">
            {material}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="sm">
          Details
        </Button>
        <Button size="sm">
          <IconNavigation className="mr-2 h-4 w-4" />
          Navigate
        </Button>
      </div>
    </div>
  )
}

export default function CollectionMapPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collection Map"
        text="Find nearby collection points and track your routes"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Collection Points Map</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  My Location
                </Button>
                <Button variant="outline" size="sm">Directions</Button>
              </div>
            </div>
            <div className="mt-4 aspect-[16/9] rounded-lg border bg-muted">
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">Map will appear here</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Nearby Collection Points */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Nearby Collection Points</h2>
            <p className="text-sm text-muted-foreground">
              Collection points within 5km of your location
            </p>
            <div className="mt-4 divide-y">
              <CollectionPoint
                name="Nairobi Central"
                address="123 Main St, Nairobi"
                distance="1.2 km away"
                status="Open"
                materials={["Plastic", "Metal", "E-Waste"]}
              />
              <CollectionPoint
                name="Westlands Hub"
                address="456 Park Ave, Westlands"
                distance="2.5 km away"
                status="Open"
                materials={["Plastic", "Paper"]}
              />
              <CollectionPoint
                name="Eastleigh Center"
                address="789 East Rd, Eastleigh"
                distance="3.8 km away"
                status="Closed"
                materials={["Plastic", "Metal", "Glass"]}
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 