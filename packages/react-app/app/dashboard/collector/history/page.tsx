"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconSearch, IconFilter, IconDownload } from "@tabler/icons-react"
import { useAfriCycle, AfricycleWasteStream, AfricycleStatus } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import { formatEther } from "viem"

// Define the contract configuration
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`
const RPC_URL = process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org"

export default function CollectionHistoryPage() {
  const { address } = useAccount()
  const [loading, setLoading] = useState(true)
  const [collections, setCollections] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filter, setFilter] = useState({
    status: "all",
    wasteType: "all",
    search: "",
  })
  
  // Initialize the AfriCycle hook
  const africycle = useAfriCycle({
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
  })
  
  useEffect(() => {
    async function fetchCollectionData() {
      if (!address || !africycle) return
      
      try {
        setLoading(true)
        
        // Log contract address
        console.log('Contract Address:', CONTRACT_ADDRESS)
        
        // Get collector stats
        const collectorStats = await africycle.getCollectorStats(address)
        setStats(collectorStats)
        
        // Get user profile for additional context
        const userProfile = await africycle.getUserProfile(address)
        console.log('User profile:', {
          name: userProfile.name,
          location: userProfile.location,
          role: userProfile.role,
          registrationDate: new Date(Number(userProfile.registrationDate) * 1000).toISOString(),
          isVerified: userProfile.isVerified,
          status: userProfile.status
        })
        
        console.log('Collector stats (detailed):', {
          totalWeightCollected: Number(collectorStats.totalCollected), // This is in kg
          totalEarnings: Number(collectorStats.totalEarnings) / 1e18,
          pendingVerifications: collectorStats.pendingVerifications.toString(),
          verifiedCollections: collectorStats.verifiedCollections.toString(),
          reputationScore: collectorStats.reputationScore.toString(),
          collectedByType: collectorStats.collectedByType.map((n: bigint) => Number(n)),
          collectedByTypeBreakdown: {
            PLASTIC: Number(collectorStats.collectedByType[0]),
            EWASTE: Number(collectorStats.collectedByType[1]),
            METAL: Number(collectorStats.collectedByType[2]),
            GENERAL: Number(collectorStats.collectedByType[3])
          },
          // Add comparison with user profile stats
          profileStats: {
            totalCollected: Number(userProfile.totalCollected),
            totalEarnings: Number(userProfile.totalEarnings) / 1e18,
            pendingVerifications: Number(userProfile.pendingVerifications),
            verifiedCollections: Number(userProfile.verifiedCollections),
            reputationScore: Number(userProfile.collectorReputationScore)
          }
        })
        
        // Get platform stats to check contract balance
        const platformStats = await africycle.getPlatformStats()
        console.log('Platform stats (detailed):', {
          contractBalance: Number(platformStats.revenue) / 1e18,
          totalCollections: Number(platformStats.collectionCount),
          totalProcessed: Number(platformStats.processedCount),
          totalListings: Number(platformStats.listingCount),
          totalCredits: Number(platformStats.creditCount),
          wasteStats: platformStats.wasteStats.map((n: bigint) => Number(n)),
          wasteStatsBreakdown: {
            PLASTIC: Number(platformStats.wasteStats[0]),
            EWASTE: Number(platformStats.wasteStats[1]),
            METAL: Number(platformStats.wasteStats[2]),
            GENERAL: Number(platformStats.wasteStats[3])
          }
        })
        
        // Get user's collections
        const userCollections = []
        let totalWeightFound = 0
        let processedCollections = 0
        let verifiedCollections = 0
        let rejectedCollections = 0
        
        // Try to fetch collections by iterating through IDs
        // Note: We check up to the platform's collection count to avoid unnecessary calls
        const maxCollectionId = Number(platformStats.collectionCount)
        console.log(`Attempting to fetch collections by ID (checking first ${maxCollectionId} collections)...`)
        
        // First, try to get collection details for each ID
        for (let i = 0; i < maxCollectionId; i++) {
          try {
            console.log(`\nChecking collection ID ${i}...`)
            const [collection, componentCounts, serialNumber, manufacturer, estimatedValue] = await africycle.getCollectionDetails(i)
            
            // Skip if collection doesn't exist or has no collector
            if (!collection || !collection.collector) {
              console.log(`Collection ${i} does not exist or has no collector`)
              continue
            }
            
            // Track collection status
            if (collection.isProcessed) processedCollections++
            if (collection.status === 1) verifiedCollections++ // Status.VERIFIED
            if (collection.status === 2) rejectedCollections++ // Status.REJECTED
            
            // Log all collection details for debugging
            console.log(`Collection ${i} details:`, {
              id: collection.id.toString(),
              collector: collection.collector,
              userAddress: address,
              matches: collection.collector?.toLowerCase() === address?.toLowerCase(),
              wasteType: collection.wasteType,
              weight: Number(collection.weight),
              status: collection.status,
              isProcessed: collection.isProcessed,
              rewardAmount: Number(collection.rewardAmount) / 1e18,
              timestamp: new Date(Number(collection.timestamp) * 1000).toISOString(),
              // Add e-waste details if available
              ...(collection.wasteType === 1 ? { // EWASTE
                componentCounts: componentCounts.map(n => Number(n)),
                serialNumber,
                manufacturer,
                estimatedValue: Number(estimatedValue)
              } : {})
            })
            
            if (collection.collector.toLowerCase() === address.toLowerCase()) {
              console.log(`Found matching collection ${i} for user`)
              totalWeightFound += Number(collection.weight)
              
              // Calculate expected reward for verification
              const weight = Number(collection.weight)
              const wasteType = collection.wasteType
              let rate = 0
              switch(wasteType) {
                case 0: rate = 0.1; break; // PLASTIC
                case 1: rate = 0.5; break; // EWASTE
                case 2: rate = 0.2; break; // METAL
                case 3: rate = 0.05; break; // GENERAL
              }
              const expectedReward = weight * rate
              console.log(`Collection ${i} reward calculation:`, {
                weight,
                wasteType,
                rate,
                expectedReward,
                actualReward: Number(collection.rewardAmount) / 1e18,
                status: collection.status,
                isProcessed: collection.isProcessed
              })
              
              userCollections.push({
                ...collection,
                id: i
              })
            } else {
              console.log(`Collection ${i} collector (${collection.collector}) doesn't match user address (${address})`)
            }
          } catch (error) {
            // Log the specific error for debugging
            if (error instanceof Error) {
              console.error(`Error fetching collection ${i}:`, error.message)
            } else {
              console.error(`Error fetching collection ${i}:`, error)
            }
            continue
          }
        }
        
        console.log('\nCollection fetch results (detailed):', {
          foundCollections: userCollections.length,
          totalWeightFound,
          expectedTotalWeight: Number(collectorStats.totalCollected),
          weightDiscrepancy: Number(collectorStats.totalCollected) - totalWeightFound,
          collectionStatus: {
            processed: processedCollections,
            verified: verifiedCollections,
            rejected: rejectedCollections
          },
          collections: userCollections.map(c => ({
            id: c.id,
            collector: c.collector,
            status: c.status,
            wasteType: c.wasteType,
            weight: c.weight.toString(),
            isProcessed: c.isProcessed,
            timestamp: new Date(Number(c.timestamp) * 1000).toISOString()
          }))
        })
        
        setCollections(userCollections)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching collection data:", error)
        setLoading(false)
      }
    }
    
    fetchCollectionData()
  }, [address, africycle])
  
  // Filter collections based on user input
  const filteredCollections = collections.filter(collection => {
    // Filter by status
    if (filter.status !== "all" && 
        AfricycleStatus[collection.status].toLowerCase() !== filter.status) {
      return false
    }
    
    // Filter by waste type
    if (filter.wasteType !== "all" && 
        AfricycleWasteStream[collection.wasteType].toLowerCase() !== filter.wasteType) {
      return false
    }
    
    // Filter by search term
    if (filter.search && 
        !collection.location.toLowerCase().includes(filter.search.toLowerCase())) {
      return false
    }
    
    return true
  })
  
  // Format date from timestamp
  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString()
  }
  
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collection History"
        text="View your collection history and earnings"
      />
      <div className="grid gap-6">
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 items-center gap-4">
                <Select>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Material Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Materials</SelectItem>
                    <SelectItem value="plastic">Plastic</SelectItem>
                    <SelectItem value="ewaste">E-Waste</SelectItem>
                    <SelectItem value="metal">Metal</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <IconFilter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collection List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Collections</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={filter.status}
                onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <IconDownload className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading collection history...
              </div>
            ) : collections.length > 0 ? (
              <div className="space-y-4">
                {filteredCollections.map((collection) => (
                  <div key={collection.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">COL-{collection.id.toString().padStart(4, '0')}</p>
                        <Badge
                          variant={
                            collection.status === AfricycleStatus.VERIFIED
                              ? "default"
                              : "destructive"
                          }
                        >
                          {AfricycleStatus[collection.status]}
                        </Badge>
                        {collection.rewardAmount > BigInt(0) && (
                          <Badge variant="outline" className="ml-2">
                            {Number(collection.rewardAmount) / 1e18} cUSD
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(collection.timestamp)} • {AfricycleWasteStream[collection.wasteType]} • {collection.weight.toString()} kg
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Location: {collection.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">Reward</p>
                        <p className="text-2xl font-bold">
                          {formatEther(collection.rewardAmount)} cUSD
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/dashboard/collector/collection/${collection.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-muted-foreground">No collections found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => window.location.href = "/dashboard/collector/scanner"}
                >
                  Create New Collection
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
          {loading ? (
            <div className="col-span-3 text-center py-8 text-muted-foreground">
              Loading statistics...
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Collections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalCollected ? (Number(stats.totalCollected) / 1e18).toFixed(0) : '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time collections (auto-verified)
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Weight Collected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.totalCollected.toString() || '0'} kg
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time collection weight
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatEther(stats?.totalEarnings || BigInt(0))} cUSD
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time earnings
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}