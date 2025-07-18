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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>         <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }
)

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

// Cache for geocoded addresses to avoid repeated API calls
const geocodeCache = new Map<string, [number, number] | null>()

// Helper function to convert address to coordinates using real geocoding services
const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
  // Return cached result if available
  if (geocodeCache.has(address)) {
    console.log(`Using cached coordinates for "${address}":`, geocodeCache.get(address))
    return geocodeCache.get(address) || null
  }
  
  // Handle empty or invalid addresses - but be more specific about what's invalid
  if (!address || address.trim() === '' || address === 'Location not specified' || address === 'Location not set') {
    console.log(`Invalid address provided: "${address}", using Lagos default`)
    const defaultLocation: [number, number] = [6.5244, 3.3792] // Lagos, Nigeria
    geocodeCache.set(address, defaultLocation)
    return defaultLocation
  }
  
  // Clean the address for better geocoding
  const cleanAddress = address.trim()
  console.log(`🌍 Starting geocoding for: "${cleanAddress}"`)
  
  try {
    // Try Google Maps Geocoding API first (most accurate)
    console.log(`Trying Google Maps geocoding for: "${cleanAddress}"`)
    const googleResult = await geocodeWithGoogle(cleanAddress)
    if (googleResult) {
      console.log(`✅ Google Maps successfully geocoded "${cleanAddress}" to:`, googleResult)
      geocodeCache.set(address, googleResult)
      return googleResult
    }
    
    // Fallback to Nominatim (OpenStreetMap) - free but has rate limits
    console.log(`Google failed, trying Nominatim for: "${cleanAddress}"`)
    const nominatimResult = await geocodeWithNominatim(cleanAddress)
    if (nominatimResult) {
      console.log(`✅ Nominatim successfully geocoded "${cleanAddress}" to:`, nominatimResult)
      geocodeCache.set(address, nominatimResult)
      return nominatimResult
    }
    
    // If geocoding completely fails, don't default to Lagos - return null and handle it separately
    console.warn(`❌ Both Google and Nominatim failed to geocode: "${cleanAddress}"`)
    geocodeCache.set(address, null)
    return null
    
  } catch (error) {
    console.error(`❌ Geocoding error for address "${cleanAddress}":`, error)
    geocodeCache.set(address, null)
    return null
  }
}

// Google Maps Geocoding API
const geocodeWithGoogle = async (address: string): Promise<[number, number] | null> => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    console.log('Google Maps API key not found, skipping Google geocoding')
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
      console.log(`Google geocoded "${address}" to:`, [location.lat, location.lng])
      return [location.lat, location.lng]
    }
    
    if (data.status === 'ZERO_RESULTS') {
      console.log(`Google geocoding: No results found for "${address}"`)
      return null
    }
    
    console.warn(`Google geocoding failed for "${address}":`, data.status)
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
    console.log(`🔍 Nominatim: Searching for "${address}"`)
    
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
    console.log(`📍 Nominatim results for "${address}":`, data)
    
    if (data && data.length > 0) {
      // Find the best match - prefer results with higher importance or city-level results
      let bestResult = data[0]
      
      // Look for better matches if we have multiple results
      for (const result of data) {
        console.log(`Evaluating result: ${result.display_name} (importance: ${result.importance})`)
        
        // Prefer results with higher importance scores
        if (result.importance && bestResult.importance && 
            parseFloat(result.importance) > parseFloat(bestResult.importance)) {
          bestResult = result
        }
      }
      
      console.log(`🎯 Selected best result: ${bestResult.display_name}`)
      
      const lat = parseFloat(bestResult.lat)
      const lng = parseFloat(bestResult.lon)
      
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log(`✅ Nominatim geocoded "${address}" to: [${lat}, ${lng}] - ${bestResult.display_name}`)
        return [lat, lng]
      }
    }
    
    console.log(`❌ Nominatim geocoding: No valid results found for "${address}"`)
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

// Helper function to get detailed inventory data for a recycler
const getRecyclerInventoryDetails = async (africycle: any, recyclerAddress: string) => {
  try {
    if (!africycle?.publicClient || !africycle?.contractAddress) {
      return { totalWeight: 0, itemCount: 0, availableListings: 0 }
    }

    // Get the recycler's inventory items
    let totalWeight = 0
    let itemCount = 0
    let availableListings = 0
    
    // Search through inventory IDs to find this recycler's items
    const MAX_INVENTORY_SEARCH = 100
    
    for (let i = 0; i < MAX_INVENTORY_SEARCH; i++) {
      try {
        const inventoryDetails = await africycle.publicClient.readContract({
          address: africycle.contractAddress,
          abi: afriCycleAbi,
          functionName: 'getInventoryDetails',
          args: [BigInt(i)]
        })
        
        // Handle both object and array responses
        let inventoryData = null
        if (inventoryDetails?.inventory) {
          inventoryData = inventoryDetails.inventory
        } else if (Array.isArray(inventoryDetails) && inventoryDetails[0]) {
          inventoryData = inventoryDetails[0]
        }
        
        if (inventoryData && 
            inventoryData.recycler && 
            inventoryData.recycler.toLowerCase() === recyclerAddress.toLowerCase()) {
          
          totalWeight += Number(inventoryData.weight) || 0
          itemCount++
          
          // Check if this inventory item is available (not sold)
          if (inventoryData.isAvailable) {
            availableListings++
          }
        }
      } catch (error) {
        // Inventory item doesn't exist or error accessing it
        break
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
    
    // Search through collection IDs to find active collections with this recycler
    const MAX_COLLECTION_SEARCH = 200
    
    for (let i = 0; i < MAX_COLLECTION_SEARCH; i++) {
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
            collectionData.selectedRecycler && 
            collectionData.selectedRecycler.toLowerCase() === recyclerAddress.toLowerCase()) {
          
          // Check if collection is active (pending, verified, or in progress)
          if (collectionData.status === AfricycleStatus.PENDING || 
              collectionData.status === AfricycleStatus.VERIFIED ||
              collectionData.status === AfricycleStatus.IN_PROGRESS) {
            
            if (collectionData.collector) {
              activeCollectors.add(collectionData.collector.toLowerCase())
            }
          }
        }
      } catch (error) {
        // Collection doesn't exist or error accessing it
        break
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
    console.log(`Fetching comprehensive data for recycler ${recyclerAddress}...`)
    
    // Get inventory details
    const inventoryDetails = await getRecyclerInventoryDetails(africycle, recyclerAddress)
    
    // Get active collectors count
    const activeCollectorsCount = await getActiveCollectorsCount(africycle, recyclerAddress)
    
    // Get additional stats
    const totalProcessed = Number(basicProfile.totalProcessed) || 0
    const completedCollections = Number(basicProfile.completedCollections) || 0
    
    console.log(`Recycler ${recyclerAddress} comprehensive data:`, {
      inventory: inventoryDetails,
      activeCollectors: activeCollectorsCount,
      totalProcessed,
      completedCollections
    })
    
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

export default function MapPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [recyclerPoints, setRecyclerPoints] = useState<any[]>([])
  const [recyclerLocations, setRecyclerLocations] = useState<any[]>([])
  const [scheduledPickups, setScheduledPickups] = useState<any[]>([])
  const [acceptedPickups, setAcceptedPickups] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [userLocationStatus, setUserLocationStatus] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("nearby")
  const [error, setError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [geocodingProgress, setGeocodingProgress] = useState<{current: number, total: number} | null>(null)
  const [geocodingStatus, setGeocodingStatus] = useState<string | null>(null)
  
  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })
  
  // Enhanced user location detection with better feedback
  const getUserLocation = useCallback(async () => {
    console.log('🎯 Starting precise location detection...')
    setUserLocationStatus('Detecting your location...')
    
    // First, try to get user location from blockchain profile
    if (africycle && address) {
      try {
        console.log(`📍 Checking blockchain profile for collector ${address}`)
        setUserLocationStatus('Checking your profile location...')
        const userProfile = await africycle.getUserProfile(address)
        console.log('Profile location data:', userProfile.location)
        
        // If we have a valid location string, try to geocode it
        if (userProfile.location && 
            userProfile.location.trim() && 
            userProfile.location !== 'Location not set' && 
            userProfile.location !== 'Location not specified') {
          
          console.log(`🔍 Attempting to geocode profile location: "${userProfile.location}"`)
          setUserLocationStatus(`Locating "${userProfile.location}"...`)
          
          // Try geocoding the profile location
          const coordinates = await geocodeAddress(userProfile.location)
          if (coordinates) {
            console.log(`✅ Successfully geocoded profile location to:`, coordinates)
            setUserLocation({
              lat: coordinates[0],
              lng: coordinates[1]
            })
            setUserLocationStatus('✅ Located from your profile!')
            setTimeout(() => setUserLocationStatus(null), 3000)
            return // Success - we're done
          } else {
            console.warn(`❌ Failed to geocode profile location: "${userProfile.location}"`)
            setUserLocationStatus('Profile location not found, trying GPS...')
          }
        } else {
          console.log(`⚠️ Profile location is empty or invalid: "${userProfile.location}"`)
          setUserLocationStatus('No profile location set, trying GPS...')
        }
      } catch (error) {
        console.error("❌ Error getting user profile:", error)
        setUserLocationStatus('Profile check failed, trying GPS...')
      }
    }
    
    // Try browser geolocation for exact location
    console.log("🌐 Requesting precise GPS location...")
    setUserLocationStatus('Requesting precise GPS location...')
    
    if (!navigator.geolocation) {
      console.log("❌ Browser geolocation not supported")
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
      
      console.log(`✅ High-accuracy GPS location:`, [position.coords.latitude, position.coords.longitude])
      console.log(`📍 Location accuracy: ${position.coords.accuracy} meters`)
      
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
      console.log('🔄 Manual location refresh triggered')
      getUserLocation()
    }

    window.addEventListener('location-refresh', handleLocationRefresh)
    return () => window.removeEventListener('location-refresh', handleLocationRefresh)
  }, [getUserLocation])

  // Convert recycler points to map locations with real geocoding
  const convertRecyclersToMapData = useCallback(async (recyclers: any[]) => {
    try {
      console.log(`Starting real-time geocoding for ${recyclers.length} recyclers...`)
      setGeocodingProgress({current: 0, total: recyclers.length})
      setGeocodingStatus("Initializing geocoding...")
      
      const mapData = []
      let processedCount = 0
      
      // Process recyclers in batches to avoid overwhelming the geocoding services
      const batchSize = 5
      for (let i = 0; i < recyclers.length; i += batchSize) {
        const batch = recyclers.slice(i, i + batchSize)
        
        setGeocodingStatus(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(recyclers.length / batchSize)}...`)
        
        const batchPromises = batch.map(async (recycler) => {
          try {
            console.log(`🔍 Geocoding: "${recycler.address}" for recycler ${recycler.name}`)
            const coordinates = await geocodeAddress(recycler.address)
            
            processedCount++
            setGeocodingProgress({current: processedCount, total: recyclers.length})
            setGeocodingStatus(`Geocoded ${processedCount}/${recyclers.length} recyclers...`)
            
            if (!coordinates) {
              console.warn(`❌ Could not geocode address: "${recycler.address}" for recycler ${recycler.name}`)
              // Don't include recyclers with failed geocoding in the map
              return null
            }
            
            console.log(`✅ Successfully geocoded ${recycler.name} at "${recycler.address}" to:`, coordinates)
            
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
              totalInventory: recycler.totalInventory,
              recyclerAddress: recycler.recyclerAddress,
              distance: distance,
              distanceKm: distanceKm, // For sorting
            }
          } catch (error) {
            console.error(`❌ Error geocoding recycler ${recycler.name}:`, error)
            processedCount++
            setGeocodingProgress({current: processedCount, total: recyclers.length})
            return null
          }
        })
        
        // Wait for batch to complete before starting next batch
        const batchResults = await Promise.all(batchPromises)
        mapData.push(...batchResults.filter(Boolean))
        
        // Update UI with partial results
        const validLocations = mapData.filter(location => location !== null)
        setRecyclerLocations([...validLocations])
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < recyclers.length) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      setGeocodingStatus("Finalizing locations...")
      
      // Final processing - sort by distance if user location is available
      const validLocations = mapData.filter(location => location !== null)
      
      if (userLocation) {
        validLocations.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
      }
      
      setRecyclerLocations(validLocations)
      
      // Update recyclerPoints with calculated distances and sort by distance
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
      
      console.log(`Geocoding complete. Successfully geocoded ${validLocations.length} out of ${recyclers.length} recyclers.`)
      
      const failedCount = recyclers.length - validLocations.length
      if (failedCount > 0) {
        setGeocodingStatus(`Complete! Found exact locations for ${validLocations.length} recyclers. ${failedCount} locations couldn't be geocoded.`)
        console.warn(`⚠️ Failed to geocode ${failedCount} recyclers. Check their location data in profiles.`)
      } else {
        setGeocodingStatus(`🎉 Perfect! Found exact locations for all ${validLocations.length} recyclers.`)
      }
      
      // Clear progress after a short delay
      setTimeout(() => {
        setGeocodingProgress(null)
        setGeocodingStatus(null)
      }, 2000)
      
    } catch (error) {
      console.error("Error converting recyclers to map data:", error)
      setMapError("Failed to load recycler locations on map")
      setGeocodingProgress(null)
      setGeocodingStatus(null)
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
            console.log(`Debug: Confirmed ${recyclerAddress} has recycler role, fetching comprehensive profile...`)
            
            // Get their basic profile first
            const basicProfile = await africycle.getUserProfile(recyclerAddress)
            
            if (basicProfile.name && basicProfile.name.trim()) {
              console.log(`Debug: Found valid recycler ${recyclerAddress}: ${basicProfile.name}`)
              
              // Get comprehensive data (inventory + active collectors)
              const comprehensiveData = await getRecyclerComprehensiveData(africycle, recyclerAddress, basicProfile)
              
              console.log(`📋 Recycler profile data for ${comprehensiveData.name}:`, {
                name: comprehensiveData.name,
                address: recyclerAddress,
                blockchain_location: comprehensiveData.location,
                location_length: comprehensiveData.location?.length || 0,
                location_trimmed: comprehensiveData.location?.trim(),
                isVerified: comprehensiveData.isVerified
              })
              
              recyclersList.push({
                address: recyclerAddress,
                name: comprehensiveData.name,
                location: comprehensiveData.location || 'Location not set',
                contactInfo: comprehensiveData.contactInfo || 'Contact info not set',
                isVerified: comprehensiveData.isVerified,
                reputationScore: comprehensiveData.recyclerReputationScore,
                totalInventory: BigInt(comprehensiveData.inventory.totalWeight),
                activeListings: BigInt(comprehensiveData.inventory.availableListings),
                // Add new comprehensive data
                inventoryDetails: comprehensiveData.inventory,
                activeCollectorsCount: comprehensiveData.activeCollectorsCount,
                totalProcessed: comprehensiveData.totalProcessed,
                completedCollections: comprehensiveData.completedCollections,
                displayData: {
                  totalInventoryDisplay: comprehensiveData.totalInventoryDisplay,
                  availableListingsDisplay: comprehensiveData.availableListingsDisplay,
                  activeCollectorsDisplay: comprehensiveData.activeCollectorsDisplay,
                }
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
          verified: r.isVerified,
          inventory: r.inventoryDetails,
          activeCollectors: r.activeCollectorsCount
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
        // Use real inventory and collectors data
        totalInventory: recycler.displayData.totalInventoryDisplay,
        activeCollectors: recycler.displayData.activeCollectorsDisplay,
        availableListings: recycler.displayData.availableListingsDisplay,
        recyclerAddress: recycler.address,
        // Add detailed data for enhanced display
        inventoryDetails: recycler.inventoryDetails,
        activeCollectorsCount: recycler.activeCollectorsCount,
        totalProcessed: recycler.totalProcessed,
        completedCollections: recycler.completedCollections,
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
      const MAX_ATTEMPTS = 100
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
            <div className="text-center max-w-md">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-base md:text-lg font-medium mb-2">Loading recycler locations...</p>
              
              {/* Geocoding Progress */}
              {geocodingProgress && (
                <div className="mb-4 w-full">
                  <div className="bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(geocodingProgress.current / geocodingProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {geocodingProgress.current} / {geocodingProgress.total} locations processed
                  </div>
                </div>
              )}
              
              {/* Geocoding Status */}
              {geocodingStatus && (
                <p className="text-sm text-primary font-medium mb-2">{geocodingStatus}</p>
              )}
              
              {/* General Status */}
              {!geocodingProgress && !geocodingStatus && (
                <div>
                  <p className="text-sm text-muted-foreground mt-1">Discovering recyclers on the network...</p>
                  <p className="text-xs text-muted-foreground mt-2">This may take a moment</p>
                </div>
              )}
              
              
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
