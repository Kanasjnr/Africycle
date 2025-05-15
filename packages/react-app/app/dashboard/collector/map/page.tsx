"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconNavigation } from "@tabler/icons-react"
import { useAfriCycle, AfricycleStatus } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"

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

export default function CollectionMapPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [collectionPoints, setCollectionPoints] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  
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
        
        // Get total number of collection points
        const stats = await africycle.getContractStats()
        const totalCollectionPoints = Number(stats.collectedStats[0]) || 0
        
        const points = []
        
        // Fetch collection points
        for (let i = 0; i < totalCollectionPoints; i++) {
          try {
            const point = await africycle.getCollection(BigInt(i))
            
            // Add to list if active (checking status instead of isActive)
            if (point.status === AfricycleStatus.PENDING || point.status === AfricycleStatus.VERIFIED) {
              points.push({
                ...point,
                // Convert id to string for display
                id: point.id.toString(),
                // Mock distance for now - in a real app, calculate based on user location
                distance: `${(Math.random() * 5).toFixed(1)} km away`,
                // Mock status - in a real app, this would come from the contract
                status: point.status === AfricycleStatus.VERIFIED ? "Open" : "Closed",
                // Mock materials - in a real app, this would come from the contract
                materials: ["Plastic", "Metal", "E-Waste"].filter(() => Math.random() > 0.3)
              })
            }
          } catch (error) {
            console.error(`Error fetching collection point ${i}:`, error)
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
  }, [africycle])
  
  const handleNavigate = (point: any) => {
    // Open in Google Maps or other mapping service
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${point.location}`
      window.open(url, '_blank')
    } else {
      alert("Please enable location services to use navigation")
    }
  }
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collection Map"
        text="Find nearby collection points and plan your routes"
      />
      <div className="grid gap-6">
        {/* Map View */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Collection Points Map</h2>
            <p className="text-sm text-muted-foreground">
              View collection points in your area
            </p>
            <div className="mt-4 aspect-[16/9] rounded-lg border bg-muted">
              {loading ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Loading map...
                </div>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {collectionPoints.length > 0 
                      ? "Map will display collection points" 
                      : "No collection points found in your area"}
                  </p>
                </div>
              )}
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
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  Loading collection points...
                </div>
              ) : collectionPoints.length > 0 ? (
                collectionPoints.slice(0, 3).map((point) => (
                  <CollectionPoint
                    key={point.id}
                    id={point.id}
                    name={point.name}
                    address={point.location}
                    distance={point.distance}
                    status={point.status}
                    materials={point.materials}
                    onNavigate={() => handleNavigate(point)}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No collection points found in your area
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
}