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
import { Skeleton } from "@/components/ui/skeleton"
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>         <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
)

import { type RecyclerLocation } from "@/components/ui/map"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || ""

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
  // Add new comprehensive data fields
  inventoryDetails: {
    totalWeight: number;
    itemCount: number;
    availableListings: number;
  };
  activeCollectorsCount: number;
  totalProcessed: number;
  completedCollections: number;
  displayData: {
    totalInventoryDisplay: string;
    availableListingsDisplay: string;
    activeCollectorsDisplay: string;
  };
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

// Persistent cache for geocoded addresses
const getGeocodeFromCache = (address: string): [number, number] | null => {
  if (typeof window === 'undefined') return null;
  const cached = localStorage.getItem(`africycle_geocode_cache_${address}`);
  return cached ? JSON.parse(cached) : null;
};

const setGeocodeToCache = (address: string, coords: [number, number] | null) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`africycle_geocode_cache_${address}`, JSON.stringify(coords));
};

// Helper function to convert address to coordinates
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  const cached = getGeocodeFromCache(address);
  if (cached) return cached;

  if (!address || address.trim() === '' || address === 'Location not specified' || address === 'Location not set') {
    const defaultLocation: [number, number] = [6.5244, 3.3792]
    setGeocodeToCache(address, defaultLocation);
    return defaultLocation
  }

  const cleanAddress = address.trim()

  try {
    const googleResult = await geocodeWithGoogle(cleanAddress)
    if (googleResult) {
      setGeocodeToCache(address, googleResult)
      return googleResult
    }

    const nominatimResult = await geocodeWithNominatim(cleanAddress)
    if (nominatimResult) {
      setGeocodeToCache(address, nominatimResult)
      return nominatimResult
    }

    setGeocodeToCache(address, null)
    return null

  } catch (error) {
    setGeocodeToCache(address, null)
    return null
  }
}

// Google Maps Geocoding API
const geocodeWithGoogle = async (address: string): Promise<[number, number] | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(address)
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Google geocoding API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return [location.lat, location.lng]
    }

    if (data.status === 'ZERO_RESULTS') {
      return null
    }

    return null

  } catch (error) {
    console.error('Google geocoding error:', error)
    return null
  }
}

// Nominatim (OpenStreetMap) geocoding - free but with rate limits
const geocodeWithNominatim = async (address: string): Promise<[number, number] | null> => {
  try {
    // Add a small delay to respect rate limits (1 request per second)
    await new Promise(resolve => setTimeout(resolve, 1000))

    const encodedAddress = encodeURIComponent(address)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=3&addressdetails=1&countrycodes=&accept-language=en`,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Africycle-App/1.0 (https://africycle.com)', // Required by Nominatim
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()

    if (data && data.length > 0) {
      // Find the best match - prefer results with higher importance or city-level results
      let bestResult = data[0]

      // Look for better matches if we have multiple results
      for (const result of data) {

        // Prefer results with higher importance scores
        if (result.importance && bestResult.importance &&
          parseFloat(result.importance) > parseFloat(bestResult.importance)) {
          bestResult = result
        }
      }


      const lat = parseFloat(bestResult.lat)
      const lng = parseFloat(bestResult.lon)

      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng]
      }
    }

    return null

  } catch (error) {
    console.error(`❌ Nominatim geocoding error for "${address}":`, error)
    return null
  }
}

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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

// Helper function to get detailed inventory data for a recycler
const getRecyclerInventoryDetails = async (africycle: any, recyclerAddress: string) => {
  try {
    if (!africycle?.publicClient || !africycle?.contractAddress) {
      return { totalWeight: 0, itemCount: 0, availableListings: 0 }
    }

    const MAX_INVENTORY_SEARCH = 100
    const ID_BATCH_SIZE = 10
    let totalWeight = 0
    let itemCount = 0
    let availableListings = 0
    let stopSearch = false

    for (let i = 0; i < MAX_INVENTORY_SEARCH && !stopSearch; i += ID_BATCH_SIZE) {
      const batchIds = Array.from({ length: Math.min(ID_BATCH_SIZE, MAX_INVENTORY_SEARCH - i) }, (_, k) => BigInt(i + k))

      const results = await Promise.all(
        batchIds.map(id =>
          africycle.publicClient.readContract({
            address: africycle.contractAddress,
            abi: afriCycleAbi,
            functionName: 'getInventoryDetails',
            args: [id]
          }).catch(() => null)
        )
      )

      for (const inventoryDetails of results) {
        if (!inventoryDetails) {
          stopSearch = true
          break
        }

        let inventoryData = inventoryDetails.inventory || (Array.isArray(inventoryDetails) ? inventoryDetails[0] : null)

        if (inventoryData && inventoryData.recycler?.toLowerCase() === recyclerAddress.toLowerCase()) {
          totalWeight += Number(inventoryData.weight) || 0
          itemCount++
          if (inventoryData.isAvailable) availableListings++
        }
      }
    }

    return { totalWeight, itemCount, availableListings }
  } catch (error) {
    console.error(`Error fetching inventory for recycler ${recyclerAddress}:`, error)
    return { totalWeight: 0, itemCount: 0, availableListings: 0 }
  }
}

// Helper function to get active collectors count for a recycler
const getActiveCollectorsCount = async (africycle: any, recyclerAddress: string) => {
  try {
    if (!africycle?.publicClient || !africycle?.contractAddress) {
      return 0
    }

    let activeCollectors = new Set<string>()
    const MAX_COLLECTION_SEARCH = 200
    const ID_BATCH_SIZE = 10
    let stopSearch = false

    for (let i = 0; i < MAX_COLLECTION_SEARCH && !stopSearch; i += ID_BATCH_SIZE) {
      const batchIds = Array.from({ length: Math.min(ID_BATCH_SIZE, MAX_COLLECTION_SEARCH - i) }, (_, k) => BigInt(i + k))

      const results = await Promise.all(
        batchIds.map(id => africycle.getCollectionDetails(id).catch(() => null))
      )

      for (const collectionDetails of results) {
        if (!collectionDetails) {
          stopSearch = true
          break
        }

        let collectionData = collectionDetails.collection || (Array.isArray(collectionDetails) ? collectionDetails[0] : null)

        if (collectionData &&
          collectionData.selectedRecycler?.toLowerCase() === recyclerAddress.toLowerCase()) {

          if (collectionData.status === AfricycleStatus.PENDING ||
            collectionData.status === AfricycleStatus.VERIFIED ||
            collectionData.status === AfricycleStatus.IN_PROGRESS) {

            if (collectionData.collector) {
              activeCollectors.add(collectionData.collector.toLowerCase())
            }
          }
        }
      }
    }

    return activeCollectors.size
  } catch (error) {
    console.error(`Error fetching active collectors for recycler ${recyclerAddress}:`, error)
    return 0
  }
}

// Helper function to get comprehensive recycler data with inventory and collectors
const getRecyclerComprehensiveData = async (africycle: any, recyclerAddress: string, basicProfile: any) => {
  try {

    // Get inventory details
    const inventoryDetails = await getRecyclerInventoryDetails(africycle, recyclerAddress)

    // Get active collectors count
    const activeCollectorsCount = await getActiveCollectorsCount(africycle, recyclerAddress)

    // Get additional stats
    const totalProcessed = Number(basicProfile.totalProcessed) || 0
    const completedCollections = Number(basicProfile.completedCollections) || 0


    return {
      ...basicProfile,
      inventory: inventoryDetails,
      activeCollectorsCount,
      totalProcessed,
      completedCollections,
      // Enhanced display data
      totalInventoryDisplay: `${inventoryDetails.totalWeight}kg (${inventoryDetails.itemCount} items)`,
      availableListingsDisplay: `${inventoryDetails.availableListings} available`,
      activeCollectorsDisplay: `${activeCollectorsCount} active`,
    }
  } catch (error) {
    console.error(`Error fetching comprehensive data for recycler ${recyclerAddress}:`, error)
    return {
      ...basicProfile,
      inventory: { totalWeight: 0, itemCount: 0, availableListings: 0 },
      activeCollectorsCount: 0,
      totalProcessed: 0,
      completedCollections: 0,
      totalInventoryDisplay: "0kg (0 items)",
      availableListingsDisplay: "0 available",
      activeCollectorsDisplay: "0 active",
    }
  }
}

interface RecyclerMapData {
  id: string;
  name: string;
  address: string;
  distance: string;
  distanceKm?: number;
  reputationScore: string;
  acceptedMaterials: string[];
  status: "active" | "busy" | "offline";
  totalInventory?: string;
  activeCollectors?: string;
  availableListings?: string;
  recyclerAddress: string;
  position?: [number, number];
  rawScore?: number;
}

interface CollectionData {
  id: string;
  name: string;
  address: string;
  distance: string;
  weight: string;
  wasteType: string;
  status: number;
  timestamp: bigint;
  selectedRecycler?: string;
  pickupTime?: bigint;
}

export default function MapPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [recyclerPoints, setRecyclerPoints] = useState<RecyclerMapData[]>([])
  const [recyclerLocations, setRecyclerLocations] = useState<RecyclerLocation[]>([])
  const [scheduledPickups, setScheduledPickups] = useState<CollectionData[]>([])
  const [acceptedPickups, setAcceptedPickups] = useState<CollectionData[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)
  const [userLocationStatus, setUserLocationStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("nearby")
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [geocodingProgress, setGeocodingProgress] = useState<{ current: number, total: number } | null>(null)
  const [geocodingStatus, setGeocodingStatus] = useState<string | null>(null)
  const [hasInitialCache, setHasInitialCache] = useState(false)

  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })

  // Enhanced user location detection with better feedback
  const getUserLocation = useCallback(async () => {
    setUserLocationStatus('Detecting your location...')

    // First, try to get user location from blockchain profile
    if (africycle && address) {
      try {
        setUserLocationStatus('Checking your profile location...')
        const userProfile = await africycle.getUserProfile(address)

        // If we have a valid location string, try to geocode it
        if (userProfile.location &&
          userProfile.location.trim() &&
          userProfile.location !== 'Location not set' &&
          userProfile.location !== 'Location not specified') {

          setUserLocationStatus(`Locating "${userProfile.location}"...`)

          // Try geocoding the profile location
          const coordinates = await geocodeAddress(userProfile.location)
          if (coordinates) {
            setUserLocation({
              lat: coordinates[0],
              lng: coordinates[1]
            })
            setUserLocationStatus('✅ Located from your profile!')
            setTimeout(() => setUserLocationStatus(null), 3000)
            return // Success - we're done
          } else {
            setUserLocationStatus('Profile location not found, trying GPS...')
          }
        } else {
          setUserLocationStatus('No profile location set, trying GPS...')
        }
      } catch (error) {
        console.error("❌ Error getting user profile:", error)
        setUserLocationStatus('Profile check failed, trying GPS...')
      }
    }

    // Try browser geolocation for exact location
    setUserLocationStatus('Requesting precise GPS location...')

    if (!navigator.geolocation) {
      setUserLocationStatus('❌ GPS not supported on this device')
      setTimeout(() => setUserLocationStatus(null), 5000)
      return
    }

    const getCurrentPositionAsync = (): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position: GeolocationPosition) => resolve(position),
          (error: GeolocationPositionError) => reject(error),
          {
            timeout: 30000,
            enableHighAccuracy: true,
            maximumAge: 0
          }
        )
      })
    }

    try {
      setUserLocationStatus('📡 Getting GPS coordinates...')
      const position = await getCurrentPositionAsync()


      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      })
      setUserLocationStatus(`✅ GPS location found! (±${Math.round(position.coords.accuracy)}m accuracy)`)
      setTimeout(() => setUserLocationStatus(null), 5000)
    } catch (geoError) {
      console.error("❌ GPS location failed:", geoError)
      setUserLocationStatus('❌ Could not get your location. Please check your GPS settings.')
      setTimeout(() => setUserLocationStatus(null), 8000)
    }
  }, [africycle, address])

  // Initial location detection
  useEffect(() => {
    getUserLocation()
  }, [getUserLocation])

  // Add event listener for manual location refresh
  useEffect(() => {
    const handleLocationRefresh = () => {
      getUserLocation()
    }

    window.addEventListener('location-refresh', handleLocationRefresh)
    return () => window.removeEventListener('location-refresh', handleLocationRefresh)
  }, [getUserLocation])

  // Convert recycler points to map locations with real geocoding
  const convertRecyclersToMapData = useCallback(async (recyclers: RecyclerMapData[]) => {
    try {
      setGeocodingProgress({ current: 0, total: recyclers.length })
      setGeocodingStatus("Initializing geocoding...")

      const mapData: (RecyclerLocation | null)[] = []
      let processedCount = 0

      // Process recyclers in batches to avoid overwhelming the geocoding services
      const batchSize = 5
      for (let i = 0; i < recyclers.length; i += batchSize) {
        const batch = recyclers.slice(i, i + batchSize)

        setGeocodingStatus(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(recyclers.length / batchSize)}...`)

        const batchPromises = batch.map(async (recycler) => {
          try {
            const coordinates = await geocodeAddress(recycler.address)

            processedCount++
            setGeocodingProgress({ current: processedCount, total: recyclers.length })
            setGeocodingStatus(`Geocoded ${processedCount}/${recyclers.length} recyclers...`)

            if (!coordinates) {
              // Don't include recyclers with failed geocoding in the map
              return null
            }


            // Calculate distance if user location is available
            let distance = "Unknown"
            let distanceKm = 0
            if (userLocation) {
              distanceKm = calculateDistance(
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
              totalInventory: recycler.totalInventory || "0kg (0 items)",
              recyclerAddress: recycler.recyclerAddress,
              distance: distance,
              distanceKm: distanceKm, // For sorting
            }
          } catch (error) {
            console.error(`❌ Error geocoding recycler ${recycler.name}:`, error)
            processedCount++
            setGeocodingProgress({ current: processedCount, total: recyclers.length })
            return null
          }
        })

        // Wait for batch to complete before starting next batch
        const batchResults = await Promise.all(batchPromises)
        mapData.push(...batchResults.filter(Boolean))

        // Update UI with partial results
        const validLocations: RecyclerLocation[] = mapData.filter((location): location is RecyclerLocation => location !== null)
        setRecyclerLocations([...validLocations])

        // Small delay between batches to respect rate limits
        if (i + batchSize < recyclers.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      setGeocodingStatus("Finalizing locations...")

      // Final processing - sort by distance if user location is available
      const validLocations: RecyclerLocation[] = mapData.filter((location): location is RecyclerLocation => location !== null)

      if (userLocation) {
        validLocations.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
      }

      setRecyclerLocations(validLocations)

      // Update recyclerPoints with calculated distances
      const updatedRecyclerPoints = recyclers.map(recycler => {
        const matchingLocation = validLocations.find(loc => loc?.id === recycler.id)
        return {
          ...recycler,
          distance: matchingLocation?.distance || "Unknown",
          distanceKm: matchingLocation?.distanceKm || 999999, // Large number for sorting
        }
      })

      // Sort by distance
      if (userLocation) {
        updatedRecyclerPoints.sort((a, b) => (a.distanceKm || 999999) - (b.distanceKm || 999999))
      }

      setRecyclerPoints(updatedRecyclerPoints)


      const failedCount = recyclers.length - validLocations.length
      if (failedCount > 0) {
        setGeocodingStatus(`Complete! Found exact locations for ${validLocations.length} recyclers. ${failedCount} locations couldn't be geocoded.`)
      } else {
        setGeocodingStatus(`🎉 Perfect! Found exact locations for all ${validLocations.length} recyclers.`)
      }


    } catch (error) {
      console.error("Error converting recyclers to map data:", error)
      setMapError("Failed to load recycler locations on map")
      setGeocodingProgress(null)
      setGeocodingStatus(null)
    }
  }, [userLocation])

  const fetchRecyclers = useCallback(async () => {
    if (!africycle || !address) {
      setLoading(false)
      return
    }

    const CACHE_KEY = 'africycle_map_recyclers_cache_v1'
    const SCAN_BLOCK_KEY = 'africycle_map_last_scanned_block_v1'
    const RECYCLER_ROLE_HASH = '0x11d2c681bc9c10ed61f9a422c0dbaaddc4054ce58ec726aca73e7e4d31bcd154'
    const DEPLOYMENT_BLOCK = BigInt(38365315)
    const CHUNK_SIZE = BigInt(500000)
    const MAX_CONCURRENCY = 8

    try {
      setLoading(true)
      setError(null)

      const publicClient = createPublicClient({
        chain: celo,
        transport: http(RPC_URL),
      })

      // 1. Load from Persistent Cache first
      const cachedData = localStorage.getItem(CACHE_KEY)
      let currentRecyclers: any[] = []
      if (cachedData) {
        try {
          currentRecyclers = JSON.parse(cachedData, (key, value) => {
            if (['reputationScore'].includes(key) && value !== null && value !== undefined) {
              try {
                return BigInt(value);
              } catch (e) {
                return value;
              }
            }
            return value;
          });
          setRecyclerPoints(currentRecyclers)
          setHasInitialCache(true)
          // Don't wait for sync if we have cache, geocode immediately
          convertRecyclersToMapData(currentRecyclers)
        } catch (e) {
          console.error("Failed to parse cached map recyclers", e)
        }
      }

      // 2. Determine Search Range (Delta-Sync)
      const currentBlock = await publicClient.getBlockNumber()
      const lastScanned = localStorage.getItem(SCAN_BLOCK_KEY)
      let fromBlock = lastScanned ? BigInt(lastScanned) + BigInt(1) : DEPLOYMENT_BLOCK

      const allNewAddresses = new Set<`0x${string}`>()
      if (fromBlock < currentBlock) {
        // 3. Parallel Discovery (Chunked)
        const chunks = []
        for (let b = fromBlock; b <= currentBlock; b += CHUNK_SIZE) {
          chunks.push({ from: b, to: b + CHUNK_SIZE > currentBlock ? currentBlock : b + CHUNK_SIZE })
        }

        for (let i = 0; i < chunks.length; i += MAX_CONCURRENCY) {
          const batch = chunks.slice(i, i + MAX_CONCURRENCY)
          const results = await Promise.all(
            batch.map(chunk =>
              publicClient.getLogs({
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
                args: { role: RECYCLER_ROLE_HASH as `0x${string}` },
                fromBlock: chunk.from,
                toBlock: chunk.to
              }).catch(() => [])
            )
          )
          results.flat().forEach(log => {
            if (log.args?.account) allNewAddresses.add(log.args.account)
          })
        }
        localStorage.setItem(SCAN_BLOCK_KEY, currentBlock.toString())
      }

      // 4. Verification and Comprehensive Data Fetching (Parallelized)
      // Always check KNOWN_RECYCLERS if they are missing from cache, and add any NEWly discovered addresses
      const newAddressesToCheck = Array.from(allNewAddresses).filter(
        addr => !currentRecyclers.some(r => r.recyclerAddress.toLowerCase() === addr.toLowerCase())
      )

      const missingKnownRecyclers = KNOWN_RECYCLERS.filter(
        addr => !currentRecyclers.some(r => r.recyclerAddress.toLowerCase() === addr.toLowerCase())
      )

      if (newAddressesToCheck.length > 0 || missingKnownRecyclers.length > 0) {
        const allPotential = Array.from(new Set([...newAddressesToCheck, ...missingKnownRecyclers]))
        const verifiedNewRecyclers: RecyclerMapData[] = []

        // Process in smaller batches to avoid overwhelming public RPC
        const VERIFY_BATCH_SIZE = 5
        for (let i = 0; i < allPotential.length; i += VERIFY_BATCH_SIZE) {
          const batch = allPotential.slice(i, i + VERIFY_BATCH_SIZE)
          const profileResults = await Promise.all(
            batch.map(async (addr) => {
              try {
                const hasRole = await africycle.hasRole(RECYCLER_ROLE_HASH, addr as `0x${string}`)
                if (!hasRole) return null
                const basicProfile = await africycle.getUserProfile(addr as `0x${string}`)
                if (!basicProfile.name?.trim()) return null

                // Fetch comprehensive data in parallel
                return getRecyclerComprehensiveData(africycle, addr as `0x${string}`, basicProfile)
              } catch (err) {
                return null
              }
            })
          )
          profileResults.forEach((p, idx) => {
            const addr = batch[idx]
            if (p) {
              verifiedNewRecyclers.push({
                id: `recycler-${addr}`,
                name: p.name,
                address: p.location || 'Location not set',
                distance: "Calculating...",
                reputationScore: p.recyclerReputationScore.toString(),
                acceptedMaterials: ["Plastic", "E-Waste", "Metal", "General"],
                status: p.isVerified ? "active" : "offline",
                totalInventory: p.totalInventoryDisplay,
                activeCollectors: p.activeCollectorsDisplay,
                availableListings: p.availableListingsDisplay,
                recyclerAddress: addr,
                // Keep metadata for sorting
                rawScore: Number(p.recyclerReputationScore)
              })
            }
          })
        }

        if (verifiedNewRecyclers.length > 0) {
          const updatedRecyclers = [...currentRecyclers, ...verifiedNewRecyclers]
          const uniqueRecyclers = Array.from(new Map(updatedRecyclers.map(r => [r.recyclerAddress.toLowerCase(), r])).values())
          uniqueRecyclers.sort((a, b) => (b.rawScore || 0) - (a.rawScore || 0))

          setRecyclerPoints(uniqueRecyclers)
          await convertRecyclersToMapData(uniqueRecyclers)
          localStorage.setItem(CACHE_KEY, JSON.stringify(uniqueRecyclers, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
          ))
        }
      }
      setLoading(false)
    } catch (error) {
      console.error('Error in map recycler discovery:', error)
      setError("Failed to discover recyclers")
      setLoading(false)
    }
  }, [africycle, address, convertRecyclersToMapData])

  // Professional approach to fetch pickups with parallelized batching
  const fetchPickups = useCallback(async () => {
    if (!africycle || !address) return

    try {
      const scheduled: CollectionData[] = []
      const accepted: CollectionData[] = []
      const MAX_ATTEMPTS = 100
      const BATCH_SIZE = 20 // Fetch 20 collections at once

      for (let i = 0; i < MAX_ATTEMPTS; i += BATCH_SIZE) {
        const batchIds = Array.from({ length: Math.min(BATCH_SIZE, MAX_ATTEMPTS - i) }, (_, k) => BigInt(i + k))

        const results = await Promise.all(
          batchIds.map(id => africycle.getCollectionDetails(id).catch(() => null))
        )

        results.forEach((collectionDetails, idx) => {
          if (!collectionDetails) return
          const currentId = i + idx

          let collectionData = collectionDetails.collection || (Array.isArray(collectionDetails) ? collectionDetails[0] : null)

          if (collectionData &&
            collectionData.collector &&
            collectionData.collector.toLowerCase() === address.toLowerCase()) {

            const collection = {
              id: currentId.toString(),
              name: `Collection #${currentId}`,
              address: collectionData.location,
              distance: "Unknown",
              weight: `${collectionData.weight.toString()}kg`,
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
        })
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

  const handleNavigate = (point: RecyclerLocation) => {
    // Open in Google Maps or other mapping service
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(point.address)}`
      window.open(url, '_blank')
    } else {
      alert("Please enable location services to use navigation")
    }
  }

  const handleContact = (point: RecyclerLocation) => {
    // For now, just copy the recycler address
    navigator.clipboard.writeText(point.recyclerAddress)
    alert(`Recycler address copied to clipboard: ${point.recyclerAddress}`)
  }

  const handleRecyclerSelect = (recycler: RecyclerLocation) => {
    // Optional: You can add logic here when a recycler is selected on the map
  }

  const handleMapNavigate = (recycler: RecyclerLocation) => {
    // Navigate to the recycler location
    if (userLocation) {
      const url = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${recycler.position[0]},${recycler.position[1]}`
      window.open(url, '_blank')
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${recycler.position[0]},${recycler.position[1]}`
      window.open(url, '_blank')
    }
  }


  if (loading && !hasInitialCache) {
    return (
      <DashboardShell>
        <div className="w-full px-4 md:px-6 lg:px-8">
          <div className="mb-6 md:mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>

          <div className="space-y-6">
            <Card className="p-4 md:p-6">
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <Skeleton className="h-7 w-56 mb-2" />
                  <Skeleton className="h-5 w-80" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-11 w-24" />
                  <Skeleton className="h-11 w-40" />
                </div>
              </div>
              <Skeleton className="h-[280px] md:h-[400px] w-full rounded-lg" />
            </Card>

            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 md:p-6">
                  <div className="flex justify-between mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-11 flex-1" />
                      <Skeleton className="h-11 flex-1" />
                    </div>
                  </div>
                </Card>
              ))}
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

          {/* Location Status */}
          {userLocationStatus && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <p className="text-sm font-medium text-blue-800">{userLocationStatus}</p>
              </div>
            </div>
          )}

          {/* Background Sync Status */}
          {loading && hasInitialCache && (
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-primary animate-pulse">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <span>Syncing with latest blockchain data...</span>
            </div>
          )}

          {/* Location Debug Info & Manual Refresh */}
          <div className="mt-3 flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {userLocation ? (
                <span className="text-green-600">
                  📍 Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              ) : (
                <span className="text-orange-600">📍 Location not detected</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setUserLocation(null)
                setUserLocationStatus(null)
                // Trigger location detection again
                const event = new Event('location-refresh')
                window.dispatchEvent(event)
              }}
              className="text-xs"
            >
              🔄 Refresh Location
            </Button>
          </div>
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
                    totalInventory={point.totalInventory || "0kg (0 items)"}
                    activeCollectors={point.activeCollectors || "0 active"}
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