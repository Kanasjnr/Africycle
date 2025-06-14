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
  IconShoppingCart,
  IconArrowUpRight,
  IconStar,
} from "@tabler/icons-react"

interface ListingCardProps {
  id: string
  title: string
  material: string
  quantity: string
  price: string
  location: string
  posted: string
  grade?: string
  status: "Active" | "Pending" | "Sold"
  offers: number
}

function ListingCard({
  id,
  title,
  material,
  quantity,
  price,
  location,
  posted,
  grade,
  status,
  offers,
}: ListingCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <IconPackage className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">{title}</h3>
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
              ID: {id} • Posted {posted} • {location}
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
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Material</p>
            <p className="font-medium">{material}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Quantity</p>
            <p className="font-medium">{quantity}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price (cUSD/kg)</p>
            <p className="font-medium">{price}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Offers</p>
            <p className="font-medium">{offers}</p>
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

interface ActivityItemProps {
  type: "offer" | "sale" | "listing"
  title: string
  description: string
  time: string
}

function ActivityItem({ type, title, description, time }: ActivityItemProps) {
  const getIcon = () => {
    switch (type) {
      case "offer":
        return <IconCoin className="h-4 w-4 text-blue-500" />
      case "sale":
        return <IconShoppingCart className="h-4 w-4 text-green-500" />
      case "listing":
        return <IconPackage className="h-4 w-4 text-orange-500" />
      default:
        return <IconPackage className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <p className="text-xs text-muted-foreground">{time}</p>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          heading="Marketplace"
          text="List and manage your material sales"
        />
        <div className="grid gap-6">
          {/* Overview Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Active Listings</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">
                  Currently listed
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconCoin className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Total Sales</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">2,450 cUSD</p>
                <div className="mt-2 flex items-center text-sm">
                  <IconArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                  <span className="text-green-500">+12%</span>
                  <span className="ml-1 text-muted-foreground">this month</span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconTruck className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Pending Orders</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">
                  Awaiting delivery
                </p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <div className="flex items-center gap-2">
                  <IconStar className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Rating</h3>
                </div>
                <p className="mt-2 text-2xl font-bold">4.8</p>
                <p className="text-sm text-muted-foreground">
                  Based on 24 reviews
                </p>
              </div>
            </Card>
          </div>

          {/* Active Listings */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Active Listings</h2>
                  <p className="text-sm text-muted-foreground">
                    Your current marketplace listings
                  </p>
                </div>
                <Button>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Create Listing
                </Button>
              </div>
              <div className="mt-6 space-y-6">
                <ListingCard
                  id="LST-2023-001"
                  title="Premium PET Plastic Flakes"
                  material="PET Plastic"
                  quantity="500kg"
                  price="2.50"
                  location="Lagos, Nigeria"
                  posted="2 days ago"
                  status="Active"
                  offers={3}
                />
                <ListingCard
                  id="LST-2023-002"
                  title="Clean HDPE Bottles"
                  material="HDPE"
                  quantity="300kg"
                  price="1.80"
                  location="Lagos, Nigeria"
                  posted="5 days ago"
                  status="Active"
                  offers={1}
                />
                <ListingCard
                  id="LST-2023-003"
                  title="Sorted Metal Scrap"
                  material="Metal"
                  quantity="200kg"
                  price="4.20"
                  location="Lagos, Nigeria"
                  posted="1 week ago"
                  status="Sold"
                  offers={0}
                />
              </div>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Your latest marketplace activities
              </p>
              <div className="space-y-4">
                <ActivityItem
                  type="offer"
                  title="New offer received"
                  description="2.30 cUSD/kg for Premium PET Plastic Flakes"
                  time="2 hours ago"
                />
                <ActivityItem
                  type="sale"
                  title="Listing sold"
                  description="Sorted Metal Scrap - 200kg for 840 cUSD"
                  time="1 day ago"
                />
                <ActivityItem
                  type="listing"
                  title="New listing created"
                  description="Clean HDPE Bottles - 300kg"
                  time="5 days ago"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
} 