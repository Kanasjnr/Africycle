"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconClock,
  IconClipboardCheck,
  IconPackage,
  IconRecycle,
  IconPlus,
  IconTrash,
  IconEye,
  IconRefresh,
} from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState, memo, useEffect, useCallback } from "react"
import { Header } from "@/components/dashboard/header"
import { useAfriCycle, type WasteCollection, type ProcessingBatch } from "@/hooks/useAfricycle"
import Image from "next/image"
import { AfricycleStatus, AfricycleWasteStream, AfricycleQualityGrade } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { EmailService } from "@/lib/email-service"

// Collection verification component
interface VerificationItemProps {
  collection: WasteCollection
  onVerify: (approved: boolean, reason?: string) => void
  isProcessing: boolean
  collectorName?: string
}

function VerificationItem({ collection, onVerify, isProcessing, collectorName }: VerificationItemProps) {
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const router = useRouter()

  const getWasteTypeString = (type: AfricycleWasteStream) => {
    switch (type) {
      case AfricycleWasteStream.PLASTIC: return "Plastic"
      case AfricycleWasteStream.EWASTE: return "E-Waste"
      case AfricycleWasteStream.METAL: return "Metal"
      case AfricycleWasteStream.GENERAL: return "General"
      default: return "Unknown"
    }
  }

  const getRelativeTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 0) {
      return "Just now"
    }
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days > 0) {
      return `${days}d ago`
    } else if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return "Just now"
    }
  }

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    onVerify(false, rejectReason)
    setShowRejectForm(false)
    setRejectReason("")
  }

  const handleViewDetails = () => {
    router.push(`/dashboard/recycler/collections/${collection.id.toString()}`)
  }

  return (
    <>
      <Card className="p-4 sm:p-6">
        <div className="space-y-4 lg:grid lg:gap-6 lg:grid-cols-[280px_1fr] lg:space-y-0">
          <div className="aspect-video overflow-hidden rounded-lg border bg-muted relative">
            {collection.imageHash ? (
              <Image 
                src={`https://res.cloudinary.com/dn2ed9k6p/image/upload/${collection.imageHash}`}
                alt="Collection verification"
                className="h-full w-full object-cover"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            <div className="flex h-full items-center justify-center">
              <IconClipboardCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium">#{collection.id.toString()}</h3>
                  <Badge variant="secondary">Pending Verification</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Collector: {collectorName || `${collection.collector.slice(0, 6)}...${collection.collector.slice(-4)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconClock className="h-4 w-4" />
                <span>{getRelativeTime(collection.timestamp)}</span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-1">
                <div>
                  <p className="text-muted-foreground">Material</p>
                  <p className="font-medium">{getWasteTypeString(collection.wasteType)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Weight</p>
                  <p className="font-medium">{collection.weight.toString()}kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{collection.location}</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Pickup Time</p>
                <p className="font-medium">{new Date(Number(collection.pickupTime) * 1000).toLocaleString()}</p>
              </div>
            </div>

            {showRejectForm && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="min-h-[80px]"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    Confirm Reject
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRejectForm(false)}
                    disabled={isProcessing}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {!showRejectForm && (
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowDetails(true)} className="w-full sm:w-auto text-sm">
                  <IconEye className="mr-2 h-4 w-4" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  className="text-red-600 hover:text-red-600 w-full sm:w-auto text-sm"
                  onClick={() => setShowRejectForm(true)}
                  disabled={isProcessing}
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button 
                  onClick={() => onVerify(true)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto text-sm"
                >
                  <IconCheck className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Mobile-Optimized Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
          {/* Mobile: Slide up from bottom, Desktop: Center modal */}
          <div className="bg-white w-full sm:w-full sm:max-w-2xl sm:mx-4 rounded-t-lg sm:rounded-lg max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-semibold">Collection Details</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-4">
                {/* Image */}
                {collection.imageHash && (
                  <div className="aspect-video overflow-hidden rounded-lg border relative">
                    <Image 
                      src={`https://res.cloudinary.com/dn2ed9k6p/image/upload/${collection.imageHash}`}
                      alt="Collection verification"
                      className="h-full w-full object-cover"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                {/* Details Grid - Single column on mobile, two columns on desktop */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Collection ID</label>
                    <p className="text-sm">#{collection.id.toString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm">Pending Verification</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Collector</label>
                    <p className="text-sm">{collectorName || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-mono">{collection.collector}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Selected Recycler</label>
                    <p className="text-xs text-muted-foreground font-mono">{collection.selectedRecycler}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Material Type</label>
                    <p className="text-sm">{getWasteTypeString(collection.wasteType)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Weight</label>
                    <p className="text-sm">{collection.weight.toString()} kg</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="text-sm">{collection.location}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quality Grade</label>
                    <p className="text-sm">{collection.quality === 0 ? 'Low' : collection.quality === 1 ? 'Medium' : collection.quality === 2 ? 'High' : 'Premium'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reward Amount</label>
                    <p className="text-sm">{(Number(collection.rewardAmount) / 1e18).toFixed(4)} cUSD</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Is Processed</label>
                    <p className="text-sm">{collection.isProcessed ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-sm">{new Date(Number(collection.timestamp) * 1000).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Pickup Time</label>
                    <p className="text-sm">{new Date(Number(collection.pickupTime) * 1000).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Batch creation component
interface BatchCreationProps {
  verifiedCollections: WasteCollection[]
  onCreateBatch: (collectionIds: bigint[], description: string) => void
  isProcessing: boolean
}

function BatchCreation({ verifiedCollections, onCreateBatch, isProcessing }: BatchCreationProps) {
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [batchDescription, setBatchDescription] = useState("")

  const getWasteTypeString = (type: AfricycleWasteStream) => {
    switch (type) {
      case AfricycleWasteStream.PLASTIC: return "Plastic"
      case AfricycleWasteStream.EWASTE: return "E-Waste"
      case AfricycleWasteStream.METAL: return "Metal"
      case AfricycleWasteStream.GENERAL: return "General"
      default: return "Unknown"
    }
  }

  const handleCollectionToggle = (collectionId: string) => {
    const newSelected = new Set(selectedCollections)
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId)
    } else {
      newSelected.add(collectionId)
    }
    setSelectedCollections(newSelected)
  }

  const handleCreateBatch = () => {
    if (selectedCollections.size === 0) {
      toast.error("Please select at least one collection")
      return
    }
    if (!batchDescription.trim()) {
      toast.error("Please provide a batch description")
      return
    }

    const collectionIds = Array.from(selectedCollections).map(id => BigInt(id))
    onCreateBatch(collectionIds, batchDescription)
    setSelectedCollections(new Set())
    setBatchDescription("")
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">Create Processing Batch</h3>
          <p className="text-sm text-muted-foreground">
            Select verified collections to create a processing batch
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Batch Description</label>
            <Textarea
              placeholder="Describe the processing method and expected outcomes..."
              value={batchDescription}
              onChange={(e) => setBatchDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Select Collections ({selectedCollections.size} selected)</label>
            <div className="mt-2 max-h-60 overflow-y-auto space-y-2">
              {verifiedCollections.map((collection) => (
                <div key={collection.id.toString()} className="flex items-center space-x-3 p-3 border rounded">
                  <Checkbox
                    checked={selectedCollections.has(collection.id.toString())}
                    onCheckedChange={() => handleCollectionToggle(collection.id.toString())}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">#{collection.id.toString()}</span>
                      <Badge variant="outline">{getWasteTypeString(collection.wasteType)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {collection.weight.toString()}kg • {collection.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button 
          onClick={handleCreateBatch}
          disabled={isProcessing || selectedCollections.size === 0 || !batchDescription.trim()}
          className="w-full"
        >
          <IconPlus className="mr-2 h-4 w-4" />
          Create Processing Batch
        </Button>
      </div>
    </Card>
  )
}

// Processing batch component
interface ProcessingBatchItemProps {
  batch: ProcessingBatch
  onComplete: (outputAmount: number, quality: AfricycleQualityGrade) => void
  isProcessing: boolean
}

function ProcessingBatchItem({ batch, onComplete, isProcessing }: ProcessingBatchItemProps) {
  const [outputAmount, setOutputAmount] = useState("")
  const [outputQuality, setOutputQuality] = useState<AfricycleQualityGrade>(AfricycleQualityGrade.MEDIUM)

  const getWasteTypeString = (type: AfricycleWasteStream) => {
    switch (type) {
      case AfricycleWasteStream.PLASTIC: return "Plastic"
      case AfricycleWasteStream.EWASTE: return "E-Waste"
      case AfricycleWasteStream.METAL: return "Metal"
      case AfricycleWasteStream.GENERAL: return "General"
      default: return "Unknown"
    }
  }

  const getQualityString = (quality: AfricycleQualityGrade) => {
    switch (quality) {
      case AfricycleQualityGrade.LOW: return "Low"
      case AfricycleQualityGrade.MEDIUM: return "Medium"
      case AfricycleQualityGrade.HIGH: return "High"
      case AfricycleQualityGrade.PREMIUM: return "Premium"
      default: return "Unknown"
    }
  }

  const getStatusString = (status: AfricycleStatus) => {
    switch (status) {
      case AfricycleStatus.IN_PROGRESS: return "In Progress"
      case AfricycleStatus.COMPLETED: return "Completed"
      default: return "Unknown"
    }
  }

  const handleComplete = () => {
    const outputAmountNum = parseFloat(outputAmount)
    if (!outputAmountNum || outputAmountNum <= 0) {
      toast.error("Please enter a valid output amount")
      return
    }
    if (outputAmountNum > Number(batch.inputAmount)) {
      toast.error("Output amount cannot exceed input amount")
      return
    }
    onComplete(outputAmountNum, outputQuality)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">Batch #{batch.id.toString()}</h3>
              <Badge variant={batch.status === AfricycleStatus.COMPLETED ? "default" : "secondary"}>
                {getStatusString(batch.status)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getWasteTypeString(batch.wasteType)} • {batch.inputAmount.toString()}kg input
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {new Date(Number(batch.timestamp) * 1000).toLocaleDateString()}
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-sm">{batch.processDescription}</p>
        </div>

        {batch.status === AfricycleStatus.COMPLETED && (
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output Amount:</span>
              <span className="font-medium">{batch.outputAmount.toString()}kg</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quality Grade:</span>
              <span className="font-medium">{getQualityString(batch.outputQuality)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Carbon Offset:</span>
              <span className="font-medium">{batch.carbonOffset.toString()} kg CO₂</span>
            </div>
          </div>
        )}

        {batch.status === AfricycleStatus.IN_PROGRESS && (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Output Amount (kg)</label>
                <Input
                  type="number"
                  placeholder="Enter output amount"
                  value={outputAmount}
                  onChange={(e) => setOutputAmount(e.target.value)}
                  max={Number(batch.inputAmount)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Output Quality</label>
                <Select value={outputQuality.toString()} onValueChange={(value) => setOutputQuality(parseInt(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Low</SelectItem>
                    <SelectItem value="1">Medium</SelectItem>
                    <SelectItem value="2">High</SelectItem>
                    <SelectItem value="3">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleComplete}
              disabled={isProcessing || !outputAmount}
              className="w-full"
            >
              <IconCheck className="mr-2 h-4 w-4" />
              Complete Processing
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}

// Stats component
interface StatsCardProps {
  title: string
  value: string
  description: string
  color?: string
}

function StatsCard({ title, value, description, color = "text-foreground" }: StatsCardProps) {
  return (
    <div className="rounded-lg border p-3 sm:p-4">
      <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{title}</h3>
      <p className={`mt-1 sm:mt-2 text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export default function MaterialVerificationPage() {
  const { address } = useAccount()
  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
  })

  const [activeTab, setActiveTab] = useState("verification")
  const [collections, setCollections] = useState<WasteCollection[]>([])
  const [processingBatches, setProcessingBatches] = useState<ProcessingBatch[]>([])
  const [collectorNames, setCollectorNames] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch collector names for the collections
  const fetchCollectorNames = useCallback(async (collections: WasteCollection[]) => {
    if (!africycle) return new Map()

    const nameMap = new Map<string, string>()
    const uniqueCollectors = Array.from(new Set(collections.map(c => c.collector)))

    try {
      // Fetch names in parallel
      const namePromises = uniqueCollectors.map(async (collector) => {
        try {
          const profile = await africycle.getUserProfile(collector)
          return { collector, name: profile.name }
        } catch (error) {
          console.log(`Failed to fetch name for collector ${collector}:`, error)
          return { collector, name: null }
        }
      })

      const results = await Promise.all(namePromises)
      results.forEach(({ collector, name }) => {
        if (name) {
          nameMap.set(collector, name)
        }
      })
    } catch (error) {
      console.error("Error fetching collector names:", error)
    }

    return nameMap
  }, [africycle])

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!africycle || !address) return

      try {
        setIsLoading(true)
        
        console.log('Debug: Fetching data for address:', address)
        
        // Check if user is registered as recycler
        try {
          const userRole = await africycle.getUserRole(address)
          console.log('Debug: User role:', userRole)
        } catch (roleError) {
          console.log('Debug: Could not get user role:', roleError)
        }
        
        // Fetch collections and processing batches in parallel
        const [collectionsData, batchesData] = await Promise.all([
          africycle.getRecyclerCollections(address),
          africycle.getRecyclerProcessingBatches(address)
        ])

        console.log('Debug: Collections data:', collectionsData)
        console.log('Debug: Batches data:', batchesData)
        console.log('Debug: Batches length:', batchesData.length)
        
        // Log individual batch statuses
        batchesData.forEach((batch, index) => {
          console.log(`Debug: Batch ${index}:`, {
            id: batch.id.toString(),
            status: batch.status,
            statusName: batch.status === AfricycleStatus.IN_PROGRESS ? 'IN_PROGRESS' : 
                       batch.status === AfricycleStatus.COMPLETED ? 'COMPLETED' : 'UNKNOWN'
          })
        })

        setCollections(collectionsData)
        setProcessingBatches(batchesData)

        // Fetch collector names after we have the collections
        if (collectionsData.length > 0) {
          const names = await fetchCollectorNames(collectionsData)
          setCollectorNames(names)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to fetch data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [africycle, address, fetchCollectorNames])

  // Manual refresh function
  const handleRefresh = async () => {
    if (!africycle || !address) return
    
    try {
      setIsLoading(true)
      console.log('Manual refresh triggered...')
      console.log('Current address:', address)
      
      // Try to get user role first
      try {
        const userRole = await africycle.getUserRole(address)
        console.log('User role during refresh:', userRole)
      } catch (roleError) {
        console.log('Could not get user role during refresh:', roleError)
      }
      
      // Debug the batch fetching process
      console.log('Attempting to fetch batches for recycler:', address)
      
      const [updatedCollections, updatedBatches] = await Promise.all([
        africycle.getRecyclerCollections(address),
        africycle.getRecyclerProcessingBatches(address).catch(error => {
          console.error('Error fetching batches specifically:', error)
          return []
        })
      ])
      
      console.log('Manual refresh - Updated collections:', updatedCollections)
      console.log('Manual refresh - Updated batches:', updatedBatches)
      
      // Check if any collections are processed
      const processedCollections = updatedCollections.filter(c => c.isProcessed)
      console.log('Processed collections count:', processedCollections.length)
      processedCollections.forEach(c => {
        console.log('Processed collection:', {
          id: c.id.toString(),
          isProcessed: c.isProcessed,
          status: c.status
        })
      })
      
      // Try alternative approach - maybe fetch all batches and filter
      try {
        console.log('Trying alternative batch fetch approach...')
        // If there's a method to get all batches, we could try that
        // For now, let's just log more details about the current approach
        console.log('africycle methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(africycle)))
      } catch (altError) {
        console.log('Alternative approach failed:', altError)
      }
      
      setCollections(updatedCollections)
      setProcessingBatches(updatedBatches)
      
      if (updatedCollections.length > 0) {
        const names = await fetchCollectorNames(updatedCollections)
        setCollectorNames(names)
      }
      
      toast.success("Data refreshed successfully")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh data")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle collection verification
  const handleVerifyCollection = async (collection: WasteCollection, approved: boolean, reason?: string) => {
    if (!africycle || !address) return

    try {
      setIsProcessing(true)
      
      if (approved) {
        await africycle.confirmPickup(address, collection.id)
        toast.success("Collection verified successfully")
        
        // Send collection confirmed email to collector
        try {
          const collectorProfile = await africycle.getUserProfile(collection.collector)
          const recyclerProfile = await africycle.getUserProfile(address)
          const collectorEmail = EmailService.extractEmailFromContactInfo(collectorProfile.contactInfo)
          
          if (collectorEmail) {
            EmailService.sendCollectionConfirmed({
              collectorEmail,
              collectionId: collection.id.toString(),
              wasteType: EmailService.getWasteTypeNumber(collection.wasteType),
              weight: Number(collection.weight),
              pickupTime: Number(collection.pickupTime),
              recyclerName: recyclerProfile.name || 'Recycler',
              recyclerContact: recyclerProfile.contactInfo,
              recyclerAddress: address,
              estimatedEarnings: Number(collection.rewardAmount) / 1e18, // Convert from wei to cUSD
            }).then((result) => {
              if (result.success) {
                console.log('Collection confirmed email sent successfully');
              } else {
                console.log('Collection confirmed email failed to send:', result.error);
              }
            }).catch((error) => {
              console.log('Collection confirmed email error:', error);
            });
            
            // Send payment received email to collector (collectors get paid when collection is confirmed)
            const paymentAmount = Number(collection.rewardAmount) / 1e18 // Convert from wei to cUSD
            const ratePerKg = paymentAmount / Number(collection.weight)
            
            EmailService.sendPaymentReceived({
              collectorEmail,
              collectionId: collection.id.toString(),
              wasteType: EmailService.getWasteTypeNumber(collection.wasteType).toString(),
              weight: Number(collection.weight),
              amount: paymentAmount,
              ratePerKg: ratePerKg,
              qualityGrade: collection.quality === 0 ? 'Low' : 
                          collection.quality === 1 ? 'Medium' : 
                          collection.quality === 2 ? 'High' : 'Premium',
              // transactionHash: could be added if available from blockchain response
            }).then((result) => {
              if (result.success) {
                console.log('Payment received email sent successfully');
              } else {
                console.log('Payment received email failed to send:', result.error);
              }
            }).catch((error) => {
              console.log('Payment received email error:', error);
            });
          } else {
            console.log('No valid email found for collector:', collectorProfile.contactInfo);
          }
        } catch (profileError) {
          console.log('Error fetching profiles for email:', profileError);
        }
        
      } else {
        await africycle.rejectPickup(address, collection.id, reason || "Failed verification")
        toast.success("Collection rejected")
        
        // Send collection rejected email to collector
        try {
          const collectorProfile = await africycle.getUserProfile(collection.collector)
          const collectorEmail = EmailService.extractEmailFromContactInfo(collectorProfile.contactInfo)
          
          if (collectorEmail) {
            EmailService.sendCollectionRejected({
              collectorEmail,
              collectionId: collection.id.toString(),
              wasteType: EmailService.getWasteTypeNumber(collection.wasteType),
              weight: Number(collection.weight),
              pickupTime: Number(collection.pickupTime),
              rejectionReason: reason || "Quality standards not met. Please review and improve for future collections.",
            }).then((result) => {
              if (result.success) {
                console.log('Collection rejected email sent successfully');
              } else {
                console.log('Collection rejected email failed to send:', result.error);
              }
            }).catch((error) => {
              console.log('Collection rejected email error:', error);
            });
          } else {
            console.log('No valid email found for collector:', collectorProfile.contactInfo);
          }
        } catch (profileError) {
          console.log('Error fetching collector profile for email:', profileError);
        }
      }

      // Refresh collections
      const updatedCollections = await africycle.getRecyclerCollections(address)
      setCollections(updatedCollections)
      
      // Update collector names if needed
      if (updatedCollections.length > 0) {
        const names = await fetchCollectorNames(updatedCollections)
        setCollectorNames(names)
      }
    } catch (error) {
      console.error("Error verifying collection:", error)
      toast.error("Failed to verify collection")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle batch creation
  const handleCreateBatch = async (collectionIds: bigint[], description: string) => {
    if (!africycle || !address) return

    try {
      setIsProcessing(true)
      
      console.log('Creating batch with collections:', collectionIds, 'description:', description)
      
      await africycle.createProcessingBatch(address, collectionIds, description)
      toast.success("Processing batch created successfully")

      // Add a small delay to ensure blockchain state has propagated
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Refresh data
      console.log('Refreshing data after batch creation...')
      const [updatedCollections, updatedBatches] = await Promise.all([
        africycle.getRecyclerCollections(address),
        africycle.getRecyclerProcessingBatches(address)
      ])
      
      console.log('Updated collections:', updatedCollections)
      console.log('Updated batches:', updatedBatches)
      
      setCollections(updatedCollections)
      setProcessingBatches(updatedBatches)
      
      // Log the filtered batches for debugging
      const newInProgressBatches = updatedBatches.filter(b => b.status === AfricycleStatus.IN_PROGRESS)
      console.log('New in-progress batches:', newInProgressBatches)
      
    } catch (error) {
      console.error("Error creating batch:", error)
      toast.error("Failed to create processing batch")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle batch completion
  const handleCompleteBatch = async (batch: ProcessingBatch, outputAmount: number, quality: AfricycleQualityGrade) => {
    if (!africycle || !address) return

    try {
      setIsProcessing(true)
      
      await africycle.completeProcessing(address, batch.id, outputAmount, quality)
      toast.success("Processing batch completed successfully")

      // Refresh batches
      const updatedBatches = await africycle.getRecyclerProcessingBatches(address)
      setProcessingBatches(updatedBatches)
    } catch (error) {
      console.error("Error completing batch:", error)
      toast.error("Failed to complete processing batch")
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter collections
  const pendingCollections = collections.filter(c => c.status === AfricycleStatus.PENDING)
  const verifiedCollections = collections.filter(c => c.status === AfricycleStatus.VERIFIED && !c.isProcessed)
  const inProgressBatches = processingBatches.filter(b => b.status === AfricycleStatus.IN_PROGRESS)
  const completedBatches = processingBatches.filter(b => b.status === AfricycleStatus.COMPLETED)

  return (
    <DashboardShell>
      <div className="w-full px-3 sm:px-4 lg:px-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Material Verification & Processing</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Verify collections and manage processing batches</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="verification" className="text-xs sm:text-sm px-2 py-2">
              <div className="text-center">
                <div className="hidden sm:block">Verification Queue</div>
                <div className="sm:hidden">Queue</div>
                <div className="text-xs">({pendingCollections.length})</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="processing" className="text-xs sm:text-sm px-2 py-2">
              <div className="text-center">
                <div className="hidden sm:block">Processing Batches</div>
                <div className="sm:hidden">Processing</div>
                <div className="text-xs">({inProgressBatches.length})</div>
              </div>
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm px-2 py-2">
              <div className="text-center">
                <div className="hidden sm:block">Completed</div>
                <div className="sm:hidden">Done</div>
                <div className="text-xs">({completedBatches.length})</div>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="verification" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Pending"
                value={pendingCollections.length.toString()}
                description="Awaiting verification"
                color="text-yellow-600"
              />
              <StatsCard
                title="Verified"
                value={collections.filter(c => c.status === AfricycleStatus.VERIFIED).length.toString()}
                description="Collections verified"
                color="text-green-600"
              />
              <StatsCard
                title="Rejected"
                value={collections.filter(c => c.status === AfricycleStatus.REJECTED).length.toString()}
                description="Collections rejected"
                color="text-red-600"
              />
              <StatsCard
                title="Ready"
                value={verifiedCollections.length.toString()}
                description="For processing"
                color="text-blue-600"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading collections...</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {pendingCollections.map((collection) => (
                  <VerificationItem
                    key={collection.id.toString()}
                    collection={collection}
                    onVerify={(approved, reason) => handleVerifyCollection(collection, approved, reason)}
                    isProcessing={isProcessing}
                    collectorName={collectorNames.get(collection.collector)}
                  />
                ))}
                {pendingCollections.length === 0 && (
                  <Card className="p-6 sm:p-8 text-center">
                    <IconClipboardCheck className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-base sm:text-lg font-semibold">No pending verifications</h3>
                    <p className="text-sm text-muted-foreground">All collections have been processed</p>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="processing" className="space-y-3 sm:space-y-4">
            <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Available"
                value={verifiedCollections.length.toString()}
                description="Ready for batching"
                color="text-blue-600"
              />
              <StatsCard
                title="Active"
                value={inProgressBatches.length.toString()}
                description="Currently processing"
                color="text-yellow-600"
              />
              <StatsCard
                title="Completed"
                value={completedBatches.length.toString()}
                description="Finished processing"
                color="text-green-600"
              />
              <StatsCard
                title="Total"
                value={processingBatches.reduce((sum, batch) => sum + Number(batch.outputAmount), 0).toString()}
                description="kg processed"
                color="text-purple-600"
              />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading processing data...</p>
              </div>
            ) : (
              <div className="space-y-6 lg:grid lg:gap-6 lg:grid-cols-2 lg:space-y-0">
                <div className="space-y-6">
                  <BatchCreation
                    verifiedCollections={verifiedCollections}
                    onCreateBatch={handleCreateBatch}
                    isProcessing={isProcessing}
                  />
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold mb-4">Active Processing Batches</h3>
                    <div className="space-y-4">
                      {inProgressBatches.map((batch) => (
                        <ProcessingBatchItem
                          key={batch.id.toString()}
                          batch={batch}
                          onComplete={(outputAmount, quality) => handleCompleteBatch(batch, outputAmount, quality)}
                          isProcessing={isProcessing}
                        />
                      ))}
                      {inProgressBatches.length === 0 && (
                        <Card className="p-4 sm:p-6 text-center">
                          <IconPackage className="mx-auto h-6 sm:h-8 w-6 sm:w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">No active processing batches</p>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 sm:space-y-6">
            <div className="space-y-4 sm:space-y-6">
              {completedBatches.map((batch) => (
                <ProcessingBatchItem
                  key={batch.id.toString()}
                  batch={batch}
                  onComplete={() => {}} // No action for completed batches
                  isProcessing={false}
                />
              ))}
              {completedBatches.length === 0 && (
                <Card className="p-6 sm:p-8 text-center">
                  <IconRecycle className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-base sm:text-lg font-semibold">No completed batches</h3>
                  <p className="text-sm text-muted-foreground">Completed processing batches will appear here</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  )
} 