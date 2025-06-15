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
  IconEdit,
  IconPlus,
  IconRefresh,
} from "@tabler/icons-react"
import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useAfriCycle, AfricycleWasteStream } from "@/hooks/useAfricycle"
import { toast } from "sonner"

interface InventoryItemProps {
  id: string
  material: string
  quantity: string
  capacity: number
  location: string
  lastUpdated: string
  status: "In Stock" | "Low Stock" | "Critical"
  onUpdate: () => void
}

function InventoryItem({
  id,
  material,
  quantity,
  capacity,
  location,
  lastUpdated,
  status,
  onUpdate,
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
        <Button variant="outline" size="sm" onClick={onUpdate}>
          <IconEdit className="mr-2 h-4 w-4" />
          Update Quantity
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
          <p className="text-muted-foreground">Total Quantity</p>
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
  onAction: () => void
}

function AlertCard({ title, description, action, onAction }: AlertCardProps) {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
          <h3 className="font-medium text-yellow-900">{title}</h3>
        </div>
        <p className="mt-1 text-sm text-yellow-800">{description}</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onAction}>
          {action}
        </Button>
      </div>
    </Card>
  )
}

export default function InventoryPage() {
  const { address } = useAccount()
  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
  })

  console.log('Inventory Page - Address:', address)
  console.log('Inventory Page - Africycle available:', !!africycle)

  const [recyclerStats, setRecyclerStats] = useState<{
    totalEarnings: bigint
    activeListings: bigint
    reputationScore: bigint
    totalInventory: bigint
    scheduledPickups: bigint
    activeCollectors: bigint
    processedByType: readonly [bigint, bigint, bigint, bigint]
    inventoryByType: readonly [bigint, bigint, bigint, bigint]
  } | null>(null)
  const [processingBatches, setProcessingBatches] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Fetch recycler stats and processing batches
  useEffect(() => {
    async function fetchRecyclerData() {
      if (!africycle || !address) {
        console.log('Missing africycle or address, skipping fetch')
        return
      }

      try {
        console.log('Fetching data for address:', address)
        setIsLoading(true)
        
        const [profile, batches] = await Promise.all([
          africycle.getUserProfile(address),
          africycle.getRecyclerProcessingBatches(address).catch(() => [])
        ])
        
        console.log('Raw inventory by type:', profile.inventoryByType)
        console.log('Processed by type (contract):', profile.processedByType)
        console.log('Total inventory:', profile.totalInventory)
        console.log('Processing batches:', batches)
        
        // Map profile data to recycler stats format
        const stats = {
          totalEarnings: profile.recyclerTotalEarnings,
          activeListings: profile.activeListings,
          reputationScore: profile.recyclerReputationScore,
          totalInventory: profile.totalInventory,
          scheduledPickups: profile.scheduledPickups,
          activeCollectors: profile.activeCollectors,
          processedByType: profile.processedByType,
          inventoryByType: profile.inventoryByType
        }
        
        setRecyclerStats(stats)
        setProcessingBatches(batches)
        setLastUpdated(new Date())
        
      } catch (error) {
        console.error('Error fetching recycler data:', error)
        toast.error("Failed to fetch inventory data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecyclerData()
  }, [africycle, address])

  // Calculate processed materials from completed processing batches
  const calculateProcessedFromBatches = (wasteTypeIndex: number) => {
    if (!processingBatches || processingBatches.length === 0) return BigInt(0)
    
    return processingBatches
      .filter(batch => batch.status === 4 && Number(batch.wasteType) === wasteTypeIndex) // Status 4 = COMPLETED
      .reduce((sum, batch) => sum + batch.outputAmount, BigInt(0))
  }

  const handleRefresh = async () => {
    if (!africycle || !address) return
    
    try {
      setIsLoading(true)
      const [profile, batches] = await Promise.all([
        africycle.getUserProfile(address),
        africycle.getRecyclerProcessingBatches(address).catch(() => [])
      ])
      
      // Map profile data to recycler stats format
      const stats = {
        totalEarnings: profile.recyclerTotalEarnings,
        activeListings: profile.activeListings,
        reputationScore: profile.recyclerReputationScore,
        totalInventory: profile.totalInventory,
        scheduledPickups: profile.scheduledPickups,
        activeCollectors: profile.activeCollectors,
        processedByType: profile.processedByType,
        inventoryByType: profile.inventoryByType
      }
      
      setRecyclerStats(stats)
      setProcessingBatches(batches)
      setLastUpdated(new Date())
      toast.success("Inventory data refreshed")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh inventory data")
    } finally {
      setIsLoading(false)
    }
  }

  const getWasteTypeString = (index: number) => {
    switch (index) {
      case 0: return "PET Plastic"
      case 1: return "E-Waste"
      case 2: return "Metal"
      case 3: return "General Waste"
      default: return "Unknown"
    }
  }

  const calculateCapacity = (current: bigint) => {
    // Convert to percentage based on reasonable storage thresholds
    // Using logarithmic scale for better visualization
    const currentNum = Number(current)
    if (currentNum === 0) return 0
    if (currentNum <= 100) return Math.min(25, currentNum / 4) // 0-100kg = 0-25%
    if (currentNum <= 500) return 25 + Math.min(50, (currentNum - 100) / 8) // 100-500kg = 25-75%  
    return 75 + Math.min(25, (currentNum - 500) / 20) // 500+ kg = 75-100%
  }

  const getInventoryStatus = (capacity: number): "In Stock" | "Low Stock" | "Critical" => {
    if (capacity >= 80) return "Critical"
    if (capacity >= 50) return "In Stock"
    return "Low Stock"
  }

  const formatWeight = (weight: bigint) => {
    return `${Number(weight)}kg`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString()
  }

  // Calculate combined inventory (raw + actual processed materials from batches)
  const getCombinedInventory = (index: number) => {
    if (!recyclerStats) return BigInt(0)
    const processed = calculateProcessedFromBatches(index)
    return recyclerStats.inventoryByType[index] + processed
  }

  // Calculate total combined inventory
  const totalCombinedInventory = recyclerStats ? 
    recyclerStats.inventoryByType.reduce((sum, raw, index) => 
      sum + raw + calculateProcessedFromBatches(index), BigInt(0)
    ) : BigInt(0)

  // Calculate total ready for processing (raw materials that are not critically full)
  const readyForProcessing = recyclerStats ? 
    recyclerStats.inventoryByType.reduce((sum, current, index) => {
      const capacity = calculateCapacity(current)
      return capacity < 80 ? sum + current : sum // Only count non-critical raw materials
    }, BigInt(0)) : BigInt(0)

  // Count storage alerts (critical or low stock based on combined inventory)
  const storageAlerts = recyclerStats ?
    Array.from({ length: 4 }, (_, index) => {
      const combined = getCombinedInventory(index)
      const capacity = calculateCapacity(combined)
      return capacity >= 80 || capacity <= 20 // Critical or low stock
    }).filter(Boolean).length : 0

  const handleUpdateQuantity = (wasteType: AfricycleWasteStream) => {
    // TODO: Implement quantity update functionality
    toast.info("Update quantity functionality coming soon")
  }

  const handleMarkForProcessing = () => {
    // TODO: Navigate to processing page or mark materials
    toast.info("Processing functionality available on Processing page")
  }

  const handleUpdateStatus = () => {
    // TODO: Update inventory status
    toast.info("Status update functionality coming soon")
  }

  if (isLoading) {
    return (
      <DashboardShell>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading inventory data...</p>
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (!recyclerStats) {
    return (
      <DashboardShell>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            <IconPackage className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No inventory data</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load inventory data. Make sure you&apos;re registered as a recycler.
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <IconRefresh className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </Card>
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
            <p className="text-muted-foreground">Monitor and manage material storage levels</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading} className="self-start sm:self-auto">
            <IconRefresh className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        <div className="grid gap-4 sm:gap-6">
          {/* Overview Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium text-sm sm:text-base">Total Inventory</h3>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold">{formatWeight(totalCombinedInventory)}</p>
                <div className="mt-2 flex items-center text-xs sm:text-sm">
                  <span className="text-muted-foreground">Last updated: {formatDate(lastUpdated)}</span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium text-sm sm:text-base">Ready to Process</h3>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold">{formatWeight(readyForProcessing)}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Available for processing
                </p>
              </div>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium text-sm sm:text-base">Storage Alerts</h3>
                </div>
                <p className="mt-2 text-xl sm:text-2xl font-bold">{storageAlerts}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Items need attention
                </p>
              </div>
            </Card>
          </div>

          {/* Contract Limitation Notice */}
          {recyclerStats && totalCombinedInventory === BigInt(0) && (
            <Card className="border-blue-200 bg-blue-50">
              <div className="p-4">
                <div className="flex items-center gap-2">
                  <IconPackage className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900 text-sm sm:text-base">Inventory Information</h3>
                </div>
                <p className="mt-1 text-sm text-blue-800">
                  Raw materials appear here when delivered by collectors. Processed materials from completed batches are tracked separately as impact credits and can be listed on the marketplace.
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" onClick={() => window.location.href = '/dashboard/recycler/processing'}>
                  View Processing History
                </Button>
              </div>
            </Card>
          )}

          {/* Alerts */}
          {storageAlerts > 0 && (
            <div className="space-y-3 sm:space-y-4">
              {Array.from({ length: 4 }, (_, index) => {
                const combined = getCombinedInventory(index)
                const capacity = calculateCapacity(combined)
                const wasteType = getWasteTypeString(index)
                
                if (capacity >= 80) {
                  return (
                    <Card key={`critical-${index}`} className="border-yellow-200 bg-yellow-50">
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
                          <h3 className="font-medium text-yellow-900 text-sm sm:text-base">Storage Capacity Alert</h3>
                        </div>
                        <p className="mt-1 text-sm text-yellow-800">
                          {wasteType} storage is at {capacity}% capacity. Consider processing materials soon.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" onClick={handleMarkForProcessing}>
                          Mark for Processing
                        </Button>
                      </div>
                    </Card>
                  )
                }
                
                if (capacity <= 20) {
                  return (
                    <Card key={`low-${index}`} className="border-yellow-200 bg-yellow-50">
                      <div className="p-4">
                        <div className="flex items-center gap-2">
                          <IconAlertTriangle className="h-5 w-5 text-yellow-600" />
                          <h3 className="font-medium text-yellow-900 text-sm sm:text-base">Low Stock Warning</h3>
                        </div>
                        <p className="mt-1 text-sm text-yellow-800">
                          {wasteType} container is nearly empty ({capacity}% capacity). Expecting more deliveries.
                        </p>
                        <Button variant="outline" size="sm" className="mt-3 w-full sm:w-auto" onClick={handleUpdateStatus}>
                          Update Status
                        </Button>
                      </div>
                    </Card>
                  )
                }
                
                return null
              }).filter(Boolean)}
            </div>
          )}

          {/* Inventory List */}
          <Card>
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Material Inventory</h2>
                  <p className="text-sm text-muted-foreground">
                    Current storage status by material type
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 rounded-md border px-3 w-full sm:w-[200px]">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search materials..."
                      className="border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <Button className="w-full sm:w-auto">
                    <IconPlus className="mr-2 h-4 w-4" />
                    Add Material
                  </Button>
                </div>
              </div>
              <div className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                {Array.from({ length: 4 }, (_, index) => {
                  const combined = getCombinedInventory(index)
                  const status = getInventoryStatus(calculateCapacity(combined))
                  const rawMaterials = recyclerStats.inventoryByType[index]
                  const processedMaterials = calculateProcessedFromBatches(index)
                  
                  return (
                    <Card key={index} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                        <div>
                          <div className="flex items-center gap-2">
                            <IconPackage className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-medium text-sm sm:text-base">{getWasteTypeString(index)}</h3>
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
                          <p className="text-xs sm:text-sm text-muted-foreground">ID: {getWasteTypeString(index).toUpperCase().replace(' ', '_')}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleUpdateQuantity(index as AfricycleWasteStream)} className="w-full sm:w-auto">
                          <IconEdit className="mr-2 h-4 w-4" />
                          Update Quantity
                        </Button>
                      </div>
                      <div className="mt-4">
                        <div className="mb-2 flex justify-between text-sm">
                          <span className="text-muted-foreground">Storage Capacity</span>
                          <span className="font-medium">{calculateCapacity(combined)}%</span>
                        </div>
                        <Progress value={calculateCapacity(combined)} />
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Raw Materials</p>
                          <p className="font-medium">{formatWeight(rawMaterials)}</p>
                          <p className="text-xs text-muted-foreground">Ready for processing</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Processed Materials</p>
                          <p className="font-medium">{formatWeight(processedMaterials)}</p>
                          <p className="text-xs text-muted-foreground">Ready for market</p>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm border-t pt-4">
                        <div>
                          <p className="text-muted-foreground">Total Quantity</p>
                          <p className="font-medium">{formatWeight(combined)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Last Updated</p>
                          <p className="font-medium">{formatDate(lastUpdated)}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
} 