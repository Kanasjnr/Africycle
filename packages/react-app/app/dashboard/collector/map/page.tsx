"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconNavigation, IconFilter, IconCalendar, IconCheck } from "@tabler/icons-react"
import { useAfriCycle, AfricycleStatus, AfricycleWasteStream } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import afriCycleAbi from '@/ABI/Africycle.json';

// Dynamically import the map component to avoid SSR issues
const RecyclerMap = dynamic(
  () => import("@/components/ui/map").then(mod => ({ default: mod.RecyclerMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
)

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

// Known recycler addresses (from verification page)
const KNOWN_RECYCLERS = [
  "0xF69B06cc7637c5742668a932F7eD1780742D4D78",
  "0x817c19bD1Ba4eD47e180a3219d12d1462C8fABDC",
  "0xF1240B5C1C468aA68Bd77DCFAf10d6d46E9CB8Ea"

] as const

interface Recycler {
  address: `0x${string}`;
  name: string;
  location: string;
  contactInfo: string;
  isVerified: boolean;
  reputationScore: bigint;
  totalInventory: bigint;
  activeListings: bigint;
}

interface RecyclerPointProps {
  id: string
  name: string
  address: string
  distance: string
  status: "active" | "busy" | "offline"
  acceptedMaterials: string[]
  onNavigate: () => void
  onContact: () => void
}

function RecyclerPoint({
  id,
  name,
  address,
  distance,
  status,
  acceptedMaterials,
  onNavigate,
  onContact,
}: RecyclerPointProps) {
  return (
    <div className="border-b py-4 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{name}</h3>
            <Badge variant={status === "active" ? "default" : status === "busy" ? "secondary" : "outline"}>
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{address}</p>
          <p className="text-sm text-muted-foreground">{distance}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {acceptedMaterials.map((material) => (
          <Badge key={material} variant="outline">
            {material}
          </Badge>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          onClick={onContact}
        >
          Contact
        </Button>
        <Button size="sm" onClick={onNavigate}>
          <IconNavigation className="mr-2 h-4 w-4" />
          Navigate
        </Button>
      </div>
    </div>
  )
}

// Enhanced RecyclerPointCard component
interface RecyclerPointCardProps {
  id: string
  name: string
  address: string
  distance: string
  reputationScore: string
  acceptedMaterials: string[]
  status: "active" | "busy" | "offline"
  totalInventory: string
  activeCollectors: string
  recyclerAddress: string
}

function RecyclerPointCard({
  id,
  name,
  address,
  distance,
  reputationScore,
  acceptedMaterials,
  status,
  totalInventory,
  activeCollectors,
  recyclerAddress,
}: RecyclerPointCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return <Badge variant="default">Active</Badge>
      case "busy":
        return <Badge variant="secondary">Busy</Badge>
      case "offline":
        return <Badge variant="outline">Offline</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getReputationColor = () => {
    const score = parseInt(reputationScore)
    if (score >= 800) return "text-green-600"
    if (score >= 500) return "text-yellow-600"
    return "text-red-600"
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
              <span className="text-sm text-muted-foreground">Reputation:</span>
              <span className={`text-sm font-medium ${getReputationColor()}`}>{reputationScore}</span>
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

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Inventory:</span>
            <span className="text-xs font-medium">{totalInventory}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">Collectors:</span>
            <span className="text-xs font-medium">{activeCollectors}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(recyclerAddress)}>
          Copy Address
        </Button>
        {status === "active" && (
          <Button size="sm" onClick={() => window.location.href = `/dashboard/collector/verification?recycler=${recyclerAddress}`}>
            <IconMapPin className="mr-1 h-3 w-3" />
            Create Collection
          </Button>
        )}
      </div>
    </Card>
  )
}

// Helper function to get role hash
const getRoleHash = async (africycle: any, roleName: 'RECYCLER_ROLE' | 'COLLECTOR_ROLE' | 'ADMIN_ROLE') => {
  if (!africycle?.publicClient || !africycle?.contractAddress) {
    throw new Error('Africycle client not properly initialized');
  }

  try {
    const roleHash = await africycle.publicClient.readContract({
      address: africycle.contractAddress,
      abi: afriCycleAbi,
      functionName: roleName
    });
    return roleHash;
  } catch (error) {
    console.error(`Error getting ${roleName}:`, error);
    throw error;
  }
};

// Helper function to convert address to coordinates (mock implementation)
// In a real app, you would use a geocoding service like Google Maps, Mapbox, or Nominatim
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  // Mock coordinates for demonstration
  // In production, replace this with actual geocoding
  const mockLocations: Record<string, [number, number]> = {
    // Sample locations in Lagos, Nigeria area
    "Location not specified": [6.5244, 3.3792], // Lagos default
    "Lagos": [6.5244, 3.3792],
    "Abuja": [9.0765, 7.3986],
    "Kano": [12.0022, 8.5919],
    "Port Harcourt": [4.8156, 7.0498],
    // Add more as needed
  }
  
  // Try to find exact match
  if (mockLocations[address]) {
    return mockLocations[address]
  }
  
  // Return random location near Lagos for demo
  const baseLat = 6.5244
  const baseLng = 3.3792
  const randomLat = baseLat + (Math.random() - 0.5) * 0.2 // ±0.1 degree variation
  const randomLng = baseLng + (Math.random() - 0.5) * 0.2 // ±0.1 degree variation
  
  return [randomLat, randomLng]
}

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c // Distance in kilometers
  
  return distance
}

// Helper function to format distance for display
const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`
  } else {
    return `${Math.round(distanceKm)}km`
  }
}

export default function MapPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [recyclerPoints, setRecyclerPoints] = useState<any[]>([])
  const [recyclerLocations, setRecyclerLocations] = useState<any[]>([])
  const [scheduledPickups, setScheduledPickups] = useState<any[]>([])
  const [acceptedPickups, setAcceptedPickups] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [activeTab, setActiveTab] = useState("nearby")
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  
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
          // Set default location (Lagos, Nigeria) if geolocation fails
          setUserLocation({ lat: 6.5244, lng: 3.3792 })
        }
      )
    } else {
      // Set default location if geolocation is not supported
      setUserLocation({ lat: 6.5244, lng: 3.3792 })
    }
  }, [])

  // Convert recycler points to map locations
  const convertRecyclersToMapData = useCallback(async (recyclers: any[]) => {
    try {
      const mapData = await Promise.all(
        recyclers.map(async (recycler) => {
          const coordinates = await geocodeAddress(recycler.address)
          if (!coordinates) {
            console.warn(`Could not geocode address: ${recycler.address}`)
            return null
          }
          
          // Calculate distance if user location is available
          let distance = "Unknown"
          if (userLocation) {
            const distanceKm = calculateDistance(
              userLocation.lat, 
              userLocation.lng, 
              coordinates[0], 
              coordinates[1]
            )
            distance = formatDistance(distanceKm)
          }
          
          return {
            id: recycler.id,
            name: recycler.name,
            position: coordinates as [number, number],
            address: recycler.address,
            status: recycler.status,
            acceptedMaterials: recycler.acceptedMaterials,
            reputationScore: recycler.reputationScore,
            totalInventory: recycler.totalInventory,
            recyclerAddress: recycler.recyclerAddress,
            distance: distance, // Add calculated distance
          }
        })
      )
      
      // Filter out null values
      const validLocations = mapData.filter(location => location !== null)
      setRecyclerLocations(validLocations)
      
      // Update recyclerPoints with calculated distances
      if (userLocation) {
        const updatedRecyclerPoints = recyclers.map(recycler => {
          const matchingLocation = validLocations.find(loc => loc?.id === recycler.id)
          return {
            ...recycler,
            distance: matchingLocation?.distance || recycler.distance
          }
        })
        setRecyclerPoints(updatedRecyclerPoints)
      }
    } catch (error) {
      console.error("Error converting recyclers to map data:", error)
      setMapError("Failed to load recycler locations on map")
    }
  }, [userLocation])

  // Fetch recyclers function (using the same logic as verification page)
  const fetchRecyclers = useCallback(async () => {
    if (!africycle || !address) {
      setLoading(false)
      return
    }

    try {
      console.log('Debug: Starting to fetch recyclers')
      setLoading(true)
      setError(null)
      
      const recyclersList: Recycler[] = []
      
      // Check known recycler addresses
      console.log('Debug: Checking known recycler addresses:', KNOWN_RECYCLERS)
      
      for (const recyclerAddress of KNOWN_RECYCLERS) {
        try {
          console.log(`Debug: Checking recycler address:`, recyclerAddress)
          const profile = await africycle.getUserProfile(recyclerAddress as `0x${string}`)
          console.log(`Debug: Got profile for ${recyclerAddress}:`, {
            role: profile.role,
            roleHash: profile.role,
            name: profile.name,
            isVerified: profile.isVerified
          })
          
          // Check if user is a recycler using the role hash
          if (profile.role === await getRoleHash(africycle, 'RECYCLER_ROLE') && profile.name) {
            console.log(`Debug: Found recycler at ${recyclerAddress}:`, profile.name)
            recyclersList.push({
              address: recyclerAddress as `0x${string}`,
              name: profile.name,
              location: profile.location,
              contactInfo: profile.contactInfo,
              isVerified: profile.isVerified,
              reputationScore: profile.recyclerReputationScore,
              totalInventory: profile.totalInventory,
              activeListings: profile.activeListings
            })
          } else {
            console.log(`Debug: Address ${recyclerAddress} is not a recycler or not registered:`, {
              role: profile.role,
              expectedRole: await getRoleHash(africycle, 'RECYCLER_ROLE'),
              hasName: !!profile.name
            })
          }
        } catch (error) {
          console.log(`Debug: Error checking address ${recyclerAddress}:`, error)
        }
      }
      
      console.log('Debug: Finished fetching recyclers:', {
        totalFound: recyclersList.length,
        recyclers: recyclersList,
        roleHash: await getRoleHash(africycle, 'RECYCLER_ROLE'),
        checkedAddresses: KNOWN_RECYCLERS
      })
      
      // Convert to display format
      const displayRecyclers = recyclersList.map((recycler, index) => ({
        id: `recycler-${index}`,
        name: recycler.name,
        address: recycler.location || "Location not specified",
        distance: "Calculating...", // Will be updated after geocoding
        reputationScore: recycler.reputationScore.toString(),
        acceptedMaterials: ["Plastic", "E-Waste", "Metal", "General"],
        status: "active" as const,
        totalInventory: `${recycler.totalInventory.toString()}kg`,
        activeCollectors: "0", // TODO: Get from profile
        recyclerAddress: recycler.address,
      }))
      
      setRecyclerPoints(displayRecyclers)
      await convertRecyclersToMapData(displayRecyclers)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching recyclers:', error)
      setError(error instanceof Error ? error.message : "Failed to load recycler information. Please try again.")
      setLoading(false)
    }
  }, [africycle, address, convertRecyclersToMapData])

  // Fetch collections for scheduled and accepted pickups
  const fetchPickups = useCallback(async () => {
    if (!africycle || !address) return

    try {
      // Get collections where user is collector
      const scheduled: any[] = []
      const accepted: any[] = []
      
      // Search through collection IDs to find user's collections
      const MAX_ATTEMPTS = 50
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
          const collectionDetails = await africycle.getCollectionDetails(BigInt(i))
          
          // Handle both object and array responses
          let collectionData = null
          if (collectionDetails?.collection) {
            collectionData = collectionDetails.collection
          } else if (Array.isArray(collectionDetails) && collectionDetails[0]) {
            collectionData = collectionDetails[0]
          }
          
          if (collectionData && 
              collectionData.collector && 
              collectionData.collector.toLowerCase() === address.toLowerCase()) {
            
            const collection = {
              id: i.toString(),
              name: `Collection #${i}`,
              address: collectionData.location,
              distance: "Unknown",
              weight: `${collectionData.weight.toString()}g`,
              wasteType: getWasteTypeString(collectionData.wasteType),
              status: collectionData.status,
              timestamp: collectionData.timestamp,
              selectedRecycler: collectionData.selectedRecycler,
              pickupTime: collectionData.pickupTime,
            }
            
            if (collectionData.status === AfricycleStatus.PENDING) {
              scheduled.push(collection)
            } else if (collectionData.status === AfricycleStatus.VERIFIED) {
              accepted.push(collection)
            }
          }
        } catch (error) {
          // Collection doesn't exist, continue
        }
      }
      
      setScheduledPickups(scheduled)
      setAcceptedPickups(accepted)
    } catch (error) {
      console.error("Error fetching pickups:", error)
    }
  }, [africycle, address])

  // Helper function to get waste type string
  const getWasteTypeString = (wasteType: number): string => {
    switch (wasteType) {
      case 0: return "Plastic"
      case 1: return "E-Waste" 
      case 2: return "Metal"
      case 3: return "General"
      default: return "Unknown"
    }
  }

  useEffect(() => {
    if (africycle && address) {
      fetchRecyclers()
      fetchPickups()
    }
  }, [africycle, address, fetchRecyclers, fetchPickups])
  
  const handleNavigate = (point: any) => {
    // Open in Google Maps or other mapping service
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.address)}`
      window.open(url, '_blank')
    } else {
      alert("Please enable location services to use navigation")
    }
  }

  const handleContact = (point: any) => {
    // For now, just copy the recycler address
    navigator.clipboard.writeText(point.recyclerAddress)
    alert(`Recycler address copied to clipboard: ${point.recyclerAddress}`)
  }

  const handleRecyclerSelect = (recycler: any) => {
    // Optional: You can add logic here when a recycler is selected on the map
    console.log("Selected recycler:", recycler)
  }

  const handleMapNavigate = (recycler: any) => {
    // Navigate to the recycler location
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${recycler.position[0]},${recycler.position[1]}`
      window.open(url, '_blank')
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${recycler.position[0]},${recycler.position[1]}`
      window.open(url, '_blank')
    }
  }
  
  if (loading) {
    return (
      <DashboardShell>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Recycler Map</h1>
            <p className="text-muted-foreground">Find nearby recyclers and manage your pickups</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading recycler locations...</p>
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Recycler Map</h1>
            <p className="text-muted-foreground">Find nearby recyclers and manage your pickups</p>
          </div>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }
  
  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Recycler Map</h1>
          <p className="text-muted-foreground">Find nearby recyclers and manage your pickups</p>
        </div>

        <div className="space-y-6">
          {/* Map View */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recycler Locations Map</h2>
                <p className="text-sm text-muted-foreground">
                  Interactive map showing registered recyclers in your area
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button size="sm" onClick={() => window.location.href = "/dashboard/collector/verification"}>
                  <IconMapPin className="mr-2 h-4 w-4" />
                  Create Collection
                </Button>
              </div>
            </div>
            
            {/* Interactive Map */}
            {mapError ? (
              <div className="h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <IconMapPin className="h-12 w-12 text-red-400 mx-auto mb-2" />
                  <p className="text-red-600 font-medium">Map Error</p>
                  <p className="text-sm text-gray-500">{mapError}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setMapError(null)}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <RecyclerMap
                recyclers={recyclerLocations}
                userLocation={userLocation}
                height="400px"
                onRecyclerSelect={handleRecyclerSelect}
                onNavigate={handleMapNavigate}
              />
            )}
            
            {/* Map Legend */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Busy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Offline</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Your Location</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {recyclerLocations.length} recycler{recyclerLocations.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="nearby">Available Recyclers</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Pickups</TabsTrigger>
              <TabsTrigger value="completed">Accepted Pickups</TabsTrigger>
            </TabsList>

            <TabsContent value="nearby" className="space-y-4">
              {recyclerPoints.length === 0 ? (
                <div className="text-center py-8">
                  <IconMapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No registered recyclers found</p>
                  <p className="text-sm text-gray-500 mb-4">
                    We&apos;re currently loading recycler information from the network.
                  </p>
                  <div className="space-y-2">
                    <Button onClick={() => window.location.href = "/dashboard/recycler"}>
                      Register as Recycler
                    </Button>
                    <br />
                    <Button variant="outline" onClick={() => window.location.href = "/dashboard/collector/verification"}>
                      Create Collection Anyway
                    </Button>
                  </div>
                </div>
              ) : (
                recyclerPoints.map((point) => (
                  <RecyclerPointCard
                    key={point.id}
                    id={point.id}
                    name={point.name}
                    address={point.address}
                    distance={point.distance}
                    reputationScore={point.reputationScore}
                    acceptedMaterials={point.acceptedMaterials}
                    status={point.status}
                    totalInventory={point.totalInventory}
                    activeCollectors={point.activeCollectors}
                    recyclerAddress={point.recyclerAddress}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              {scheduledPickups.length === 0 ? (
                <div className="text-center py-8">
                  <IconCalendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No scheduled pickups</p>
                  <p className="text-sm text-gray-500">Your pending pickups will appear here</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => window.location.href = "/dashboard/collector/verification"}
                  >
                    Create New Collection
                  </Button>
                </div>
              ) : (
                scheduledPickups.map((pickup) => (
                  <Card key={pickup.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{pickup.name}</h3>
                        <p className="text-sm text-muted-foreground">{pickup.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{pickup.wasteType}</Badge>
                          <span className="text-xs text-muted-foreground">{pickup.weight}</span>
                        </div>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              {acceptedPickups.length === 0 ? (
                <div className="text-center py-8">
                  <IconCheck className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">No accepted pickups</p>
                  <p className="text-sm text-gray-500">Pickups accepted by recyclers will appear here</p>
                </div>
              ) : (
                acceptedPickups.map((pickup) => (
                  <Card key={pickup.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{pickup.name}</h3>
                        <p className="text-sm text-muted-foreground">{pickup.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{pickup.wasteType}</Badge>
                          <span className="text-xs text-muted-foreground">{pickup.weight}</span>
                        </div>
                      </div>
                      <Badge variant="default">Accepted</Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardShell>
  )
}