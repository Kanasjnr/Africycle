"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  IconSearch,
  IconFilter,
  IconPackage,
  IconAlertTriangle,
  IconArrowUpRight,
  IconTruck,
  IconPlus,
} from "@tabler/icons-react"

interface InventoryItemProps {
  id: string
  material: string
  quantity: string
  capacity: number
  location: string
  lastUpdated: string
  status: "In Stock" | "Low Stock" | "Critical"
}

function InventoryItem({
  id,
  material,
  quantity,
  capacity,
  location,
  lastUpdated,
  status,
}: InventoryItemProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <IconPackage className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{material}</h3>
            <Badge
              variant={
                status === "In Stock"
                  ? "default"
                  : status === "Low Stock"
                  ? "secondary"
                  : "destructive"
              }
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">ID: {id}</p>
        </div>
        <Button variant="outline" size="sm">
          <IconTruck className="mr-2 h-4 w-4" />
          Request Pickup
        </Button>
      </div>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">Storage Capacity</span>
          <span className="font-medium">{capacity}%</span>
        </div>
        <Progress value={capacity} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Quantity</p>
          <p className="font-medium">{quantity}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Location</p>
          <p className="font-medium">{location}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Last Updated</p>
          <p className="font-medium">{lastUpdated}</p>
        </div>
      </div>
    </Card>
  )
}

interface AlertCardProps {
  title: string
  description: string
  action: string
}

function AlertCard({ title, description, action }: AlertCardProps) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
          <h3 className="font-medium text-yellow-900">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-yellow-800">{description}</p>
        <Button variant="outline" size="sm" className="mt-2">
          {action}
        </Button>
      </div>
    </Card>
  )
}

export default function InventoryPage() {
  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          heading="Inventory Tracking"
          text="Monitor and manage material inventory levels"
        />
        <div className="grid gap-6">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Total Inventory</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">1,250kg</p>
                <div className="mt-2 flex items-center text-sm">
                  <IconArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+15%</span>
                  <span className="ml-1 text-muted-foreground">from last month</span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconTruck className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Pending Pickups</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">
                  Scheduled for this week
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Storage Alerts</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">
                  Items need attention
                </p>
              </div>
            </Card>
          </div>

          {/* Alerts */}
          <div className="space-y-4">
            <AlertCard
              title="Storage Capacity Alert"
              description="PET Plastic storage is at 85% capacity. Consider scheduling a pickup."
              action="Schedule Pickup"
            />
            <AlertCard
              title="Low Stock Warning"
              description="E-Waste container is nearly empty (15% capacity). Update inventory status."
              action="Update Status"
            />
          </div>

          {/* Inventory List */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Material Inventory</h2>
                  <p className="text-sm text-muted-foreground">
                    Current inventory status by material type
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search materials..."
                      className="border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <Button>
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              </div>
              <div className="mt-6 space-y-6">
                <InventoryItem
                  id="INV-2023-001"
                  material="PET Plastic"
                  quantity="500kg"
                  capacity={85}
                  location="Storage Bay A"
                  lastUpdated="2023-03-20"
                  status="In Stock"
                />
                <InventoryItem
                  id="INV-2023-002"
                  material="HDPE"
                  quantity="300kg"
                  capacity={60}
                  location="Storage Bay B"
                  lastUpdated="2023-03-19"
                  status="In Stock"
                />
                <InventoryItem
                  id="INV-2023-003"
                  material="E-Waste"
                  quantity="50kg"
                  capacity={15}
                  location="Storage Bay C"
                  lastUpdated="2023-03-18"
                  status="Low Stock"
                />
                <InventoryItem
                  id="INV-2023-004"
                  material="Metal"
                  quantity="450kg"
                  capacity={90}
                  location="Storage Bay D"
                  lastUpdated="2023-03-17"
                  status="Critical"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
} 