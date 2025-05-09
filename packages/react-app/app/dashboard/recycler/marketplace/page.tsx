"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconPackage,
  IconTruck,
  IconCoin,
  IconEdit,
  IconTrash,
  IconPlus,
} from "@tabler/icons-react"

interface ListingCardProps {
  id: string
  material: string
  quantity: string
  price: string
  grade: string
  status: "Active" | "Pending" | "Sold"
  createdAt: string
}

function ListingCard({
  id,
  material,
  quantity,
  price,
  grade,
  status,
  createdAt,
}: ListingCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <IconPackage className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">{material}</h3>
              <Badge
                variant={
                  status === "Active"
                    ? "default"
                    : status === "Pending"
                    ? "secondary"
                    : "outline"
                }
              >
                {status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ID: {id} • Listed on {createdAt}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <IconEdit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm">
              <IconTrash className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Quantity</p>
            <p className="font-medium">{quantity}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-medium">{price}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Grade</p>
            <p className="font-medium">{grade}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface OrderCardProps {
  id: string
  buyer: string
  items: string[]
  total: string
  status: "Pending" | "Processing" | "Shipped" | "Completed"
  date: string
}

function OrderCard({ id, buyer, items, total, status, date }: OrderCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <IconTruck className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Order {id}</h3>
              <Badge
                variant={
                  status === "Completed"
                    ? "default"
                    : status === "Shipped"
                    ? "secondary"
                    : "outline"
                }
              >
                {status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              From {buyer} • {date}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">View Details</Button>
            <Button size="sm">Update Status</Button>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Items</p>
          <ul className="mt-1 space-y-1">
            {items.map((item, index) => (
              <li key={index} className="text-sm">
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="font-medium">{total}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default function MarketplacePage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Marketplace"
        text="List and manage your recycled materials"
      />
      <div className="grid gap-6">
        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconPackage className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Active Listings</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">12</p>
              <p className="text-sm text-muted-foreground">3 pending approval</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconTruck className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Open Orders</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">2 need shipping</p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconCoin className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Revenue (MTD)</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">$2,450</p>
              <p className="text-sm text-muted-foreground">+15% from last month</p>
            </div>
          </Card>
        </div>

        {/* Listings */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Material Listings</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your listed materials
                </p>
              </div>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
            </div>
            <Tabs defaultValue="active" className="mt-6">
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="sold">Sold</TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <TabsContent value="active" className="space-y-4">
                  <ListingCard
                    id="LST-2023-0045"
                    material="PET Plastic Flakes"
                    quantity="500 kg"
                    price="$1.20/kg"
                    grade="Grade A"
                    status="Active"
                    createdAt="Mar 20, 2023"
                  />
                  <ListingCard
                    id="LST-2023-0046"
                    material="HDPE Pellets"
                    quantity="300 kg"
                    price="$1.50/kg"
                    grade="Grade B"
                    status="Active"
                    createdAt="Mar 19, 2023"
                  />
                </TabsContent>
                <TabsContent value="pending" className="space-y-4">
                  <ListingCard
                    id="LST-2023-0047"
                    material="Mixed Paper"
                    quantity="1000 kg"
                    price="$0.30/kg"
                    grade="Grade C"
                    status="Pending"
                    createdAt="Mar 21, 2023"
                  />
                </TabsContent>
                <TabsContent value="sold" className="space-y-4">
                  <ListingCard
                    id="LST-2023-0044"
                    material="Aluminum Cans"
                    quantity="200 kg"
                    price="$2.00/kg"
                    grade="Grade A"
                    status="Sold"
                    createdAt="Mar 15, 2023"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>

        {/* Orders */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Orders</h2>
                <p className="text-sm text-muted-foreground">
                  Track and manage incoming orders
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <OrderCard
                id="ORD-2023-0089"
                buyer="EcoPlastics Ltd"
                items={[
                  "300kg PET Plastic Flakes",
                  "200kg HDPE Pellets",
                ]}
                total="$660.00"
                status="Processing"
                date="Mar 21, 2023"
              />
              <OrderCard
                id="ORD-2023-0088"
                buyer="Green Recycling Co"
                items={[
                  "500kg Mixed Paper",
                  "100kg Aluminum Cans",
                ]}
                total="$350.00"
                status="Shipped"
                date="Mar 20, 2023"
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 