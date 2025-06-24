"use client"

import { useEffect, useState, useCallback } from "react"
import dynamic from "next/dynamic"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconMapPin, IconNavigation, IconFilter, IconCalendar, IconCheck, IconPhone, IconCopy } from "@tabler/icons-react"
import { useAfriCycle, AfricycleStatus, AfricycleWasteStream } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import afriCycleAbi from '@/ABI/Africycle.json';
import {
  createPublicClient,
  http,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
  type Transport,
  type Chain,
  type Account,
} from 'viem';
import { celo } from 'viem/chains';

// Dynamically import the map component to avoid SSR issues
const RecyclerMap = dynamic(
  () => import("@/components/ui/map").then(mod => ({ default: mod.RecyclerMap })),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[280px] md:h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm sm:text-base truncate">{name}</h3>
            <Badge variant={status === "active" ? "default" : status === "busy" ? "secondary" : "outline"} className="text-xs">
              {status}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{address}</p>
          <p className="text-xs sm:text-sm text-muted-foreground">{distance}</p>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {acceptedMaterials.slice(0, 3).map((material) => (
          <Badge key={material} variant="outline" className="text-xs">
            {material}
          </Badge>
        ))}
        {acceptedMaterials.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{acceptedMaterials.length - 3} more
          </Badge>
        )}
      </div>
      <div className="mt-3 flex gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 text-xs min-h-[40px]"
          onClick={onContact}
        >
          <IconPhone className="mr-1 h-3 w-3" />
          Contact
        </Button>
        <Button size="sm" className="flex-1 text-xs min-h-[40px]" onClick={onNavigate}>
          <IconNavigation className="mr-1 h-3 w-3" />
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
        return <Badge variant="default" className="text-xs">Active</Badge>
      case "busy":
        return <Badge variant="secondary" className="text-xs">Busy</Badge>
      case "offline":
        return <Badge variant="outline" className="text-xs">Offline</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Unknown</Badge>
    }
  }

  const getReputationColor = () => {
    const score = parseInt(reputationScore)
    if (score >= 800) return "text-green-600"
    if (score >= 500) return "text-yellow-600"
    return "text-red-600"
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(recyclerAddress)
    // You could add a toast notification here
    alert("Address copied to clipboard!")
  }

  return (
    <Card className="p-4 md:p-6 touch-manipulation">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-base md:text-lg truncate">{name}</h3>
            {getStatusBadge()}
          </div>
          <p className="text-sm md:text-base text-muted-foreground truncate mb-2">{address}</p>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <p className="text-sm md:text-base text-muted-foreground flex items-center">
              <IconMapPin className="mr-1 h-4 w-4" /> {distance}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm md:text-base text-muted-foreground">Reputation:</span>
              <span className={`text-sm md:text-base font-semibold ${getReputationColor()}`}>{reputationScore}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">Accepted Materials:</p>
        <div className="flex flex-wrap gap-2">
          {acceptedMaterials.slice(0, 4).map((material) => (
            <Badge key={material} variant="outline" className="text-sm px-3 py-1">
              {material}
            </Badge>
          ))}
          {acceptedMaterials.length > 4 && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              +{acceptedMaterials.length - 4} more
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Inventory:</span>
            <span className="text-sm font-semibold">{totalInventory}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Active Collectors:</span>
            <span className="text-sm font-semibold">{activeCollectors}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Button 
          variant="outline" 
          className="flex-1 min-h-[44px] text-sm"
          onClick={handleCopyAddress}
        >
          <IconCopy className="mr-2 h-4 w-4" />
          Copy Address
        </Button>
        {status === "active" && (
          <Button 
            className="flex-1 min-h-[44px] text-sm"
            onClick={() => window.location.href = `/dashboard/collector/verification?recycler=${recyclerAddress}`}
          >
            <IconMapPin className="mr-2 h-4 w-4" />
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

  // Professional approach to fetch all recyclers from the blockchain (same as verification page)
  const fetchRecyclers = useCallback(async () => {
    if (!africycle || !address) {
      setLoading(false)
      return
    }

    try {
      console.log('Debug: Starting professional recycler discovery for map...')
      setLoading(true)
      setError(null)
      
      const recyclersList: Recycler[] = []
      
      // Create public client for event fetching
      const publicClient = createPublicClient({
        chain: celo,
        transport: http(RPC_URL),
      })

      // Use the known recycler role hash for efficiency
      const RECYCLER_ROLE_HASH = '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154'
      console.log(`Debug: Using recycler role hash: ${RECYCLER_ROLE_HASH}`)
      
      // Professional approach: Search for RoleGranted events with the specific recycler role
      let recyclerAddresses: `0x${string}`[] = []
      
      try {
        console.log('Debug: Fetching RoleGranted events for RECYCLER_ROLE...')
        
        // Get current block to determine search range
        const currentBlock = await publicClient.getBlockNumber()
        console.log(`Debug: Current block: ${currentBlock}`)
        
        // Search in chunks to avoid RPC limits - start from a reasonable deployment block
        const DEPLOYMENT_BLOCK = BigInt(38000000) // Approximate Celo deployment block
        const CHUNK_SIZE = BigInt(50000) // Reasonable chunk size for Celo
        
        let fromBlock = DEPLOYMENT_BLOCK
        const allRoleGrantedEvents: any[] = []
        
        while (fromBlock <= currentBlock) {
          const toBlock = fromBlock + CHUNK_SIZE > currentBlock ? currentBlock : fromBlock + CHUNK_SIZE
          
          console.log(`Debug: Searching blocks ${fromBlock} to ${toBlock}...`)
          
          try {
            const roleGrantedEvents = await publicClient.getLogs({
              address: CONTRACT_ADDRESS,
              event: {
                type: 'event',
                name: 'RoleGranted',
                inputs: [
                  { name: 'role', type: 'bytes32', indexed: true },
                  { name: 'account', type: 'address', indexed: true },
                  { name: 'sender', type: 'address', indexed: true }
                ]
              },
              args: {
                role: RECYCLER_ROLE_HASH as `0x${string}`
              },
              fromBlock: fromBlock,
              toBlock: toBlock
            })
            
            allRoleGrantedEvents.push(...roleGrantedEvents)
            console.log(`Debug: Found ${roleGrantedEvents.length} RECYCLER_ROLE grants in blocks ${fromBlock}-${toBlock}`)
            
          } catch (chunkError) {
            console.log(`Debug: Error fetching events for blocks ${fromBlock}-${toBlock}:`, chunkError)
            // Continue with next chunk
          }
          
          fromBlock = toBlock + BigInt(1)
        }
        
        console.log(`Debug: Total RoleGranted events found: ${allRoleGrantedEvents.length}`)
        
        // Extract unique recycler addresses from events
        recyclerAddresses = Array.from(
          new Set(
            allRoleGrantedEvents
              .map(event => event.args?.account)
              .filter(Boolean)
          )
        ) as `0x${string}`[]
        
        console.log(`Debug: Found ${recyclerAddresses.length} unique recycler addresses from RoleGranted events:`, recyclerAddresses)
        
      } catch (eventError) {
        console.log('Debug: Error fetching RoleGranted events:', eventError)
        console.log('Debug: Falling back to known recyclers and direct role checking')
        recyclerAddresses = []
      }
      
      // Add known recyclers to the search list (in case events missed some)
      const allAddressesToCheck = Array.from(
        new Set([...recyclerAddresses, ...KNOWN_RECYCLERS])
      ) as `0x${string}`[]
      
      console.log(`Debug: Total addresses to verify for map: ${allAddressesToCheck.length}`)
      
      // Verify each address and get their profiles
      for (const recyclerAddress of allAddressesToCheck) {
        try {
          console.log(`Debug: Verifying recycler ${recyclerAddress}...`)
          
          // Double-check they have the recycler role (in case of role revocations)
          const hasRole = await africycle.hasRole(RECYCLER_ROLE_HASH, recyclerAddress)
          
          if (hasRole) {
            console.log(`Debug: Confirmed ${recyclerAddress} has recycler role, fetching profile...`)
            
            // Get their profile
            const profile = await africycle.getUserProfile(recyclerAddress)
            
            if (profile.name && profile.name.trim()) {
              console.log(`Debug: Found valid recycler ${recyclerAddress}: ${profile.name}`)
              recyclersList.push({
                address: recyclerAddress,
                name: profile.name,
                location: profile.location || 'Location not set',
                contactInfo: profile.contactInfo || 'Contact info not set',
                isVerified: profile.isVerified,
                reputationScore: profile.recyclerReputationScore,
                totalInventory: profile.totalInventory,
                activeListings: profile.activeListings
              })
            } else {
              console.log(`Debug: ${recyclerAddress} has recycler role but incomplete profile`)
            }
          } else {
            console.log(`Debug: ${recyclerAddress} no longer has recycler role`)
          }
        } catch (error) {
          console.log(`Debug: Error verifying recycler ${recyclerAddress}:`, error)
          // Continue with next address
        }
      }
      
      // Sort recyclers by reputation score (descending) and then by name
      recyclersList.sort((a, b) => {
        const reputationDiff = Number(b.reputationScore) - Number(a.reputationScore)
        if (reputationDiff !== 0) return reputationDiff
        return a.name.localeCompare(b.name)
      })
      
      console.log('Debug: Professional recycler discovery complete for map:', {
        totalFound: recyclersList.length,
        recyclers: recyclersList.map(r => ({ 
          address: r.address, 
          name: r.name, 
          reputation: Number(r.reputationScore),
          verified: r.isVerified
        }))
      })
      
      // Convert to display format for map
      const displayRecyclers = recyclersList.map((recycler, index) => ({
        id: `recycler-${index}`,
        name: recycler.name,
        address: recycler.location,
        distance: "Calculating...", // Will be updated after geocoding
        reputationScore: recycler.reputationScore.toString(),
        acceptedMaterials: ["Plastic", "E-Waste", "Metal", "General"],
        status: recycler.isVerified ? "active" as const : "offline" as const,
        totalInventory: `${recycler.totalInventory.toString()}kg`,
        activeCollectors: recycler.activeListings.toString(),
        recyclerAddress: recycler.address,
      }))
      
      setRecyclerPoints(displayRecyclers)
      await convertRecyclersToMapData(displayRecyclers)
      setLoading(false)
      
    } catch (error) {
      console.error('Error in professional recycler discovery for map:', error)
      setError(error instanceof Error ? error.message : "Failed to discover recyclers. Please try again.")
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
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recycler Map</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Find nearby recyclers and manage your pickups</p>
          </div>
          <div className="flex items-center justify-center h-64 md:h-80">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-base md:text-lg font-medium">Loading recycler locations...</p>
              <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
            </div>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (error) {
    return (
      <DashboardShell>
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recycler Map</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Find nearby recyclers and manage your pickups</p>
          </div>
          <div className="flex items-center justify-center h-64 md:h-80">
            <div className="text-center px-4 max-w-md">
              <p className="text-red-600 mb-4 text-sm md:text-base">{error}</p>
              <Button onClick={() => window.location.reload()} className="min-h-[44px]">
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
      <div className="w-full px-4 md:px-6 lg:px-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Recycler Map</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Find nearby recyclers and manage your pickups</p>
        </div>

        <div className="space-y-6">
          {/* Map View */}
          <Card className="p-4 md:p-6">
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg md:text-xl font-semibold">Recycler Locations Map</h2>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Interactive map showing registered recyclers in your area
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="min-h-[44px] text-sm">
                  <IconFilter className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Filter</span>
                  <span className="sm:hidden">Filter</span>
                </Button>
                <Button className="min-h-[44px] text-sm" onClick={() => window.location.href = "/dashboard/collector/verification"}>
                  <IconMapPin className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Create Collection</span>
                  <span className="sm:hidden">Create</span>
                </Button>
              </div>
            </div>
            
            {/* Interactive Map */}
            {mapError ? (
              <div className="h-[280px] md:h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center px-4">
                  <IconMapPin className="h-12 w-12 md:h-16 md:w-16 text-red-400 mx-auto mb-4" />
                  <p className="text-red-600 font-semibold text-base md:text-lg mb-2">Map Error</p>
                  <p className="text-sm md:text-base text-gray-500 mb-4">{mapError}</p>
                  <Button 
                    variant="outline" 
                    className="min-h-[44px]"
                    onClick={() => setMapError(null)}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <div className="h-[280px] md:h-[400px]">
                <RecyclerMap
                  recyclers={recyclerLocations}
                  userLocation={userLocation}
                  height="100%"
                  onRecyclerSelect={handleRecyclerSelect}
                  onNavigate={handleMapNavigate}
                />
              </div>
            )}
            
            {/* Map Legend */}
            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:gap-6 text-sm md:text-base">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Busy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span>Offline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>Your Location</span>
                </div>
              </div>
              <div className="text-sm md:text-base text-muted-foreground font-medium">
                {recyclerLocations.length} recycler{recyclerLocations.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </Card>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="nearby" className="text-sm md:text-base">Available</TabsTrigger>
              <TabsTrigger value="scheduled" className="text-sm md:text-base">Scheduled</TabsTrigger>
              <TabsTrigger value="completed" className="text-sm md:text-base">Accepted</TabsTrigger>
            </TabsList>

            <TabsContent value="nearby" className="space-y-4 mt-6">
              {recyclerPoints.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <IconMapPin className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold text-base md:text-lg mb-2">No registered recyclers found</p>
                  <p className="text-sm md:text-base text-gray-500 mb-6 max-w-md mx-auto">
                    We&apos;re currently loading recycler information from the network. You can register as a recycler or create a collection anyway.
                  </p>
                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <Button onClick={() => window.location.href = "/dashboard/recycler"} className="w-full min-h-[44px]">
                      Register as Recycler
                    </Button>
                    <Button variant="outline" onClick={() => window.location.href = "/dashboard/collector/verification"} className="w-full min-h-[44px]">
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

            <TabsContent value="scheduled" className="space-y-4 mt-6">
              {scheduledPickups.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <IconCalendar className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold text-base md:text-lg mb-2">No scheduled pickups</p>
                  <p className="text-sm md:text-base text-gray-500 mb-6">Your pending pickups will appear here</p>
                  <Button 
                    className="min-h-[44px]"
                    onClick={() => window.location.href = "/dashboard/collector/verification"}
                  >
                    Create New Collection
                  </Button>
                </div>
              ) : (
                scheduledPickups.map((pickup) => (
                  <Card key={pickup.id} className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate mb-1">{pickup.name}</h3>
                        <p className="text-sm md:text-base text-muted-foreground truncate mb-2">{pickup.address}</p>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">{pickup.wasteType}</Badge>
                          <span className="text-sm text-muted-foreground font-medium">{pickup.weight}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm px-3 py-1 ml-4">Pending</Badge>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-4 mt-6">
              {acceptedPickups.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <IconCheck className="h-16 w-16 md:h-20 md:w-20 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-semibold text-base md:text-lg mb-2">No accepted pickups</p>
                  <p className="text-sm md:text-base text-gray-500">Pickups accepted by recyclers will appear here</p>
                </div>
              ) : (
                acceptedPickups.map((pickup) => (
                  <Card key={pickup.id} className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg truncate mb-1">{pickup.name}</h3>
                        <p className="text-sm md:text-base text-muted-foreground truncate mb-2">{pickup.address}</p>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">{pickup.wasteType}</Badge>
                          <span className="text-sm text-muted-foreground font-medium">{pickup.weight}</span>
                        </div>
                      </div>
                      <Badge variant="default" className="text-sm px-3 py-1 ml-4">Accepted</Badge>
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