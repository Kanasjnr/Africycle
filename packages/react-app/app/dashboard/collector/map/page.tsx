"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconNavigation, IconFilter, IconCalendar } from "@tabler/icons-react"
import { useAfriCycle, AfricycleStatus } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

interface CollectionPointProps {
  id: string
  name: string
  address: string
  distance: string
  status: "Open" | "Closed"
  materials: string[]
  onNavigate: () => void
}

function CollectionPoint({
  id,
  name,
  address,
  distance,
  status,
  materials,
  onNavigate,
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
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => window.location.href = `/dashboard/collector/collection-point/${id}`}
        >
          Details
        </Button>
        <Button size="sm" onClick={onNavigate}>
          <IconNavigation className="mr-2 h-4 w-4" />
          Navigate
        </Button>
      </div>
    </div>
  )
}

// Enhanced CollectionPointCard component
interface CollectionPointCardProps {
  id: string
  name: string
  address: string
  distance: string
  capacity: string
  acceptedMaterials: string[]
  status: "active" | "full" | "completed"
  lastPickup: string
}

function CollectionPointCard({
  id,
  name,
  address,
  distance,
  capacity,
  acceptedMaterials,
  status,
  lastPickup,
}: CollectionPointCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "full":
        return <Badge variant="destructive">Full</Badge>
      case "completed":
        return <Badge variant="secondary">Completed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getCapacityColor = () => {
    const capacityNum = parseInt(capacity)
    if (capacityNum >= 90) return "text-red-600"
    if (capacityNum >= 70) return "text-yellow-600"
    return "text-green-600"
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm text-muted-foreground">{address}</p>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-muted-foreground">📍 {distance}</p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Capacity:</span>
              <span className={`text-sm font-medium ${getCapacityColor()}`}>{capacity}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-3">
        <p className="text-xs text-muted-foreground mb-2">Accepted Materials:</p>
        <div className="flex flex-wrap gap-1">
          {acceptedMaterials.map((material) => (
            <Badge key={material} variant="outline" className="text-xs">
              {material}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Last pickup: {lastPickup}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = `/dashboard/collector/collection-point/${id}`}>
            Details
          </Button>
          {status === "active" && (
            <Button size="sm">
              <IconNavigation className="mr-1 h-3 w-3" />
              Navigate
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function MapPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [collectionPoints, setCollectionPoints] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [activeTab, setActiveTab] = useState("nearby")
  
  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })
  
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error("Error getting location:", error)
        }
      )
    }
    
    async function fetchCollectionPoints() {
      if (!africycle) {
        console.error("AfriCycle instance is not available")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        
        // Use getGlobalStats instead of getContractStats
        const stats = await africycle.getGlobalStats()
        const totalCollectionPoints = Number(stats.collectedStats[0]) || 0
        
        const points = []
        
        // Since getCollection doesn't exist, we'll create mock data based on available stats
        // In a real implementation, you would need a method to get all collections or 
        // iterate through collection IDs using getCollectionDetails
        
        // For now, let's use mock data with some real stats integration
        const mockCollectionPoints = [
          {
            id: "1",
            collector: address || "0x0000000000000000000000000000000000000000",
            wasteType: 0, // PLASTIC
            weight: BigInt(500),
            location: "Lagos Island Collection Hub, 15 Marina Street, Lagos Island",
            imageHash: "QmexampleHash1",
            status: AfricycleStatus.VERIFIED,
            timestamp: BigInt(Date.now() - 86400000), // 1 day ago
            quality: 2, // HIGH
            rewardAmount: BigInt(100),
            isProcessed: false,
            pickupTime: BigInt(Date.now() + 86400000), // 1 day from now
            selectedRecycler: "0x1234567890123456789012345678901234567890",
            distance: "0.8 km",
            materials: ["Plastic", "Metal", "E-Waste"]
          },
          {
            id: "2", 
            collector: address || "0x0000000000000000000000000000000000000000",
            wasteType: 1, // EWASTE
            weight: BigInt(300),
            location: "Victoria Island Waste Center, 23 Ahmadu Bello Way, Victoria Island",
            imageHash: "QmexampleHash2",
            status: AfricycleStatus.PENDING,
            timestamp: BigInt(Date.now() - 43200000), // 12 hours ago
            quality: 1, // MEDIUM
            rewardAmount: BigInt(75),
            isProcessed: false,
            pickupTime: BigInt(Date.now() + 172800000), // 2 days from now
            selectedRecycler: "0x1234567890123456789012345678901234567890",
            distance: "1.2 km",
            materials: ["Plastic", "Paper"]
          },
          {
            id: "3",
            collector: address || "0x0000000000000000000000000000000000000000", 
            wasteType: 2, // METAL
            weight: BigInt(800),
            location: "Ikoyi Recycling Point, 45 Kingsway Road, Ikoyi",
            imageHash: "QmexampleHash3",
            status: AfricycleStatus.VERIFIED,
            timestamp: BigInt(Date.now() - 432000000), // 5 days ago
            quality: 3, // PREMIUM
            rewardAmount: BigInt(150),
            isProcessed: true,
            pickupTime: BigInt(Date.now() - 86400000), // 1 day ago
            selectedRecycler: "0x1234567890123456789012345678901234567890",
            distance: "2.1 km",
            materials: ["E-Waste", "Metal"]
          }
        ]
        
        // Filter and format the mock data
        for (const point of mockCollectionPoints) {
          if (point.status === AfricycleStatus.PENDING || point.status === AfricycleStatus.VERIFIED) {
            points.push({
              ...point,
              // Convert status to display format
              status: point.status === AfricycleStatus.VERIFIED ? "Open" : "Closed",
            })
          }
        }
        
        // Sort by distance (mock)
        points.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        
        setCollectionPoints(points)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching collection points:", error)
        setLoading(false)
      }
    }
    
    fetchCollectionPoints()
  }, [africycle, address])
  
  const handleNavigate = (point: any) => {
    // Open in Google Maps or other mapping service
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.location)}`
      window.open(url, '_blank')
    } else {
      alert("Please enable location services to use navigation")
    }
  }
  
  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <DashboardHeader
          heading="Collection Map"
          text="Find nearby collection points and schedule pickups"
        />

        <div className="space-y-6">
          {/* Map View */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Collection Points Map</h2>
                <p className="text-sm text-muted-foreground">
                  Interactive map showing collection points in your area
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button size="sm">
                  <IconMapPin className="mr-2 h-4 w-4" />
                  Add Point
                </Button>
              </div>
            </div>
            
            {/* Placeholder for map */}
            <div className="h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <IconMapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">Interactive Map</p>
                <p className="text-sm text-gray-500">Map integration coming soon</p>
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="nearby">Nearby Points</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="nearby" className="space-y-4">
              <CollectionPointCard
                id="CP-001"
                name="Lagos Island Collection Hub"
                address="15 Marina Street, Lagos Island"
                distance="0.8 km"
                capacity="85%"
                acceptedMaterials={["Plastic", "Metal", "E-Waste"]}
                status="active"
                lastPickup="2 days ago"
              />
              <CollectionPointCard
                id="CP-002"
                name="Victoria Island Waste Center"
                address="23 Ahmadu Bello Way, Victoria Island"
                distance="1.2 km"
                capacity="60%"
                acceptedMaterials={["Plastic", "Paper"]}
                status="active"
                lastPickup="1 day ago"
              />
              <CollectionPointCard
                id="CP-003"
                name="Ikoyi Recycling Point"
                address="45 Kingsway Road, Ikoyi"
                distance="2.1 km"
                capacity="95%"
                acceptedMaterials={["E-Waste", "Metal"]}
                status="full"
                lastPickup="5 days ago"
              />
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <div className="text-center py-8">
                <IconCalendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">No scheduled pickups</p>
                <p className="text-sm text-gray-500">Schedule your first pickup from nearby points</p>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <CollectionPointCard
                id="CP-004"
                name="Surulere Collection Center"
                address="12 Adeniran Ogunsanya Street, Surulere"
                distance="3.5 km"
                capacity="40%"
                acceptedMaterials={["Plastic", "Metal", "Paper"]}
                status="completed"
                lastPickup="1 week ago"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}