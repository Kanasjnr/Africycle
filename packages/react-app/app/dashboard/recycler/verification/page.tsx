"use client"

import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  IconSearch,
  IconFilter,
  IconCheck,
  IconX,
  IconClock,
  IconClipboardCheck,
  IconArrowRight,
  IconPackage,
  IconTruck,
  IconRecycle,
  IconCircle,
  IconPlus,
} from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState, memo, useEffect } from "react"
import { Header } from "@/components/dashboard/header"
import { useAfriCycle, type WasteCollection, type ProcessingBatch } from "@/hooks/useAfricycle"
import { AfricycleStatus, AfricycleWasteStream, AfricycleQualityGrade } from "@/hooks/useAfricycle"
import { useAccount } from "wagmi"
import { toast } from "sonner"

interface VerificationItemProps {
  id: string
  collector: string
  material: string
  weight: string
  date: string
  location: string
  waitingTime: string
  onVerify: (approved: boolean) => void
}

function VerificationItem({
  id,
  collector,
  material,
  weight,
  date,
  location,
  waitingTime,
  onVerify,
}: VerificationItemProps) {
  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
          <div className="flex h-full items-center justify-center">
            <IconClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{id}</h3>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Collector: {collector}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{waitingTime}</span>
            </div>
          </div>
          <div className="grid gap-1 text-sm">
            <div className="grid grid-cols-3">
              <div>
                <p className="text-muted-foreground">Material</p>
                <p className="font-medium">{material}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Weight</p>
                <p className="font-medium">{weight}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Location</p>
                <p className="font-medium">{location}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium">{date}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">View Details</Button>
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-600"
              onClick={() => onVerify(false)}
            >
              <IconX className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button onClick={() => onVerify(true)}>
              <IconCheck className="mr-2 h-4 w-4" />
              Approve
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface StatCardProps {
  title: string
  value: string
  description: string
  color?: string
}

function StatCard({ title, value, description, color = "text-foreground" }: StatCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

interface GuidelineProps {
  number: string
  title: string
  description: string
}

function Guideline({ number, title, description }: GuidelineProps) {
  return (
    <div className="rounded-lg bg-muted/50 p-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">{number}.</span>
        <h3 className="font-medium">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

type ProcessingStage = 'verification' | 'sorting' | 'processing' | 'packaging' | 'shipping'

interface ProcessingItem {
  id: string
  collectionId: string
  material: string
  weight: string
  status: AfricycleStatus
  currentStage: ProcessingStage
  progress: number
  startDate: string
  estimatedCompletion: string
  location: string
  notes?: string
}

const getStatusString = (status: AfricycleStatus): string => {
  switch (status) {
    case AfricycleStatus.PENDING:
      return "pending"
    case AfricycleStatus.VERIFIED:
      return "verified"
    case AfricycleStatus.REJECTED:
      return "rejected"
    case AfricycleStatus.IN_PROGRESS:
      return "in progress"
    case AfricycleStatus.COMPLETED:
      return "completed"
    case AfricycleStatus.CANCELLED:
      return "cancelled"
    case AfricycleStatus.ACTIVE:
      return "active"
    default:
      return "unknown"
  }
}

const getStatusBadgeVariant = (status: AfricycleStatus): "default" | "secondary" => {
  switch (status) {
    case AfricycleStatus.COMPLETED:
      return "default"
    default:
      return "secondary"
  }
}

const ProcessingItem = memo(({ 
  item,
  onUpdateStatus
}: { 
  item: ProcessingItem
  onUpdateStatus: (id: string, status: AfricycleStatus) => void
}) => {
  const stages: ProcessingStage[] = ['verification', 'sorting', 'processing', 'packaging', 'shipping']
  const currentStageIndex = stages.indexOf(item.currentStage)

  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
            <div className="flex h-full items-center justify-center">
              <IconPackage className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={getStatusBadgeVariant(item.status)}>
                {getStatusString(item.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Started {item.startDate}
              </span>
            </div>
            <Progress value={item.progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Estimated completion: {item.estimatedCompletion}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">#{item.collectionId}</h3>
                <Badge variant="outline">{item.material}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Weight: {item.weight}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onUpdateStatus(item.id, AfricycleStatus.COMPLETED)}
                disabled={item.status === AfricycleStatus.COMPLETED}
              >
                <IconCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-5 gap-2">
              {stages.map((stage, index) => (
                <div 
                  key={stage}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center ${
                    index <= currentStageIndex ? 'bg-primary/10' : 'bg-muted/50'
                  }`}
                >
                  {index === currentStageIndex ? (
                    <IconRecycle className="h-4 w-4 text-primary" />
                  ) : index < currentStageIndex ? (
                    <IconCircle className="h-4 w-4 text-primary" />
                  ) : (
                    <IconArrowRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-xs capitalize">{stage}</span>
                </div>
              ))}
            </div>

            {item.notes && (
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button variant="outline" size="sm">
              Update Notes
            </Button>
            {item.status === AfricycleStatus.IN_PROGRESS && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600">
                <IconX className="mr-2 h-4 w-4" />
                Pause Processing
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
})
ProcessingItem.displayName = 'ProcessingItem'

const ProcessingStats = memo(({ batches }: { batches: ProcessingBatchItem[] }) => {
  const totalBatches = batches.length
  const completedBatches = batches.filter(b => b.status === AfricycleStatus.COMPLETED).length
  const inProgressBatches = batches.filter(b => b.status === AfricycleStatus.IN_PROGRESS).length
  const totalCarbonOffset = batches.reduce((sum, b) => sum + (b.carbonOffset || BigInt(0)), BigInt(0))

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Batches"
        value={totalBatches.toString()}
        description="Processing batches"
        color="text-blue-600"
      />
      <StatCard
        title="Completed"
        value={completedBatches.toString()}
        description="Successfully processed"
        color="text-green-600"
      />
      <StatCard
        title="In Progress"
        value={inProgressBatches.toString()}
        description="Currently processing"
        color="text-yellow-600"
      />
      <StatCard
        title="Total Carbon Offset"
        value={`${totalCarbonOffset.toString()} kg CO₂`}
        description="Environmental impact"
        color="text-purple-600"
      />
    </div>
  )
})
ProcessingStats.displayName = 'ProcessingStats'

interface ProcessingBatchItem {
  id: string
  collections: WasteCollection[]
  wasteType: AfricycleWasteStream
  totalWeight: bigint
  status: AfricycleStatus
  startDate: string
  estimatedCompletion: string
  outputAmount?: bigint
  outputQuality?: AfricycleQualityGrade
  carbonOffset?: bigint
  processDescription: string
}

function ProcessingBatchCard({ 
  batch,
  onComplete
}: { 
  batch: ProcessingBatchItem
  onComplete: (id: string, outputAmount: bigint, quality: AfricycleQualityGrade) => void
}) {
  const [outputAmount, setOutputAmount] = useState("")
  const [selectedQuality, setSelectedQuality] = useState<AfricycleQualityGrade>(AfricycleQualityGrade.MEDIUM)

  return (
    <Card className="p-6">
      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
            <div className="flex h-full items-center justify-center">
              <IconPackage className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant={batch.status === AfricycleStatus.COMPLETED ? "default" : "secondary"}>
                {getStatusString(batch.status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Started {batch.startDate}
              </span>
            </div>
            {batch.carbonOffset && (
              <div className="rounded-lg bg-green-50 p-2 text-center">
                <p className="text-sm font-medium text-green-700">
                  Carbon Offset: {batch.carbonOffset.toString()} kg CO₂
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Batch #{batch.id}</h3>
                <Badge variant="outline">{getWasteTypeString(batch.wasteType)}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Total Weight: {batch.totalWeight.toString()}kg
              </p>
              <p className="text-sm text-muted-foreground">
                Collections: {batch.collections.length}
              </p>
            </div>
            {batch.status === AfricycleStatus.IN_PROGRESS && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onComplete(batch.id, BigInt(outputAmount), selectedQuality)}
                disabled={!outputAmount}
              >
                <IconCheck className="mr-2 h-4 w-4" />
                Complete Processing
              </Button>
            )}
          </div>

          {batch.status === AfricycleStatus.IN_PROGRESS && (
            <div className="grid gap-4 rounded-lg border p-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Output Amount (kg)</label>
                <Input
                  type="number"
                  value={outputAmount}
                  onChange={(e) => setOutputAmount(e.target.value)}
                  placeholder="Enter processed amount"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Output Quality</label>
                <Select
                  value={selectedQuality.toString()}
                  onValueChange={(value) => setSelectedQuality(Number(value) as AfricycleQualityGrade)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AfricycleQualityGrade.LOW.toString()}>Low</SelectItem>
                    <SelectItem value={AfricycleQualityGrade.MEDIUM.toString()}>Medium</SelectItem>
                    <SelectItem value={AfricycleQualityGrade.HIGH.toString()}>High</SelectItem>
                    <SelectItem value={AfricycleQualityGrade.PREMIUM.toString()}>Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm text-muted-foreground">{batch.processDescription}</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              View Details
            </Button>
            <Button variant="outline" size="sm">
              Update Notes
            </Button>
            {batch.status === AfricycleStatus.IN_PROGRESS && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-600">
                <IconX className="mr-2 h-4 w-4" />
                Pause Processing
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// Add this helper function at the top level
const getWasteTypeString = (wasteType: AfricycleWasteStream): string => {
  switch (wasteType) {
    case AfricycleWasteStream.PLASTIC:
      return "Plastic"
    case AfricycleWasteStream.EWASTE:
      return "E-Waste"
    case AfricycleWasteStream.METAL:
      return "Metal"
    case AfricycleWasteStream.GENERAL:
      return "General"
    default:
      return "Unknown"
  }
}

export default function ProcessingDashboard() {
  const { address } = useAccount()
  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
  })

  const [activeTab, setActiveTab] = useState("active")
  const [processingBatches, setProcessingBatches] = useState<ProcessingBatchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCollections, setSelectedCollections] = useState<WasteCollection[]>([])

  // Fetch processing batches
  useEffect(() => {
    async function fetchData() {
      if (!africycle || !address) return

      try {
        setIsLoading(true)
        
        // Get verified collections ready for processing
        const collectionDetails = await africycle.getCollectionDetails(0)
        
        if (collectionDetails?.collection) {
          const collection = collectionDetails.collection
          
          // Only show collections assigned to this recycler
          if (collection.selectedRecycler?.toLowerCase() === address.toLowerCase() && 
              collection.status === AfricycleStatus.VERIFIED) {
            // Create a processing batch from this collection
            // Note: This is a placeholder. You'll need to implement proper batch creation
            setProcessingBatches([{
              id: "1",
              collections: [collection],
              wasteType: collection.wasteType,
              totalWeight: collection.weight,
              status: AfricycleStatus.IN_PROGRESS,
              startDate: new Date(Number(collection.timestamp) * 1000).toLocaleDateString(),
              estimatedCompletion: "Tomorrow",
              processDescription: "Processing batch for verified collection"
            }])
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to fetch processing data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [africycle, address])

  // Handle batch completion
  const handleCompleteBatch = async (batchId: string, outputAmount: bigint, quality: AfricycleQualityGrade) => {
    if (!africycle || !address) return

    try {
      await africycle.completeProcessing(address, BigInt(batchId), outputAmount, quality)
      toast.success("Processing batch completed")

      // Refresh batches
      // Note: This is a placeholder. You'll need to implement proper batch refresh
      setProcessingBatches(prev => 
        prev.map(batch => 
          batch.id === batchId 
            ? { ...batch, status: AfricycleStatus.COMPLETED, outputAmount, outputQuality: quality }
            : batch
        )
      )
    } catch (error) {
      console.error("Error completing batch:", error)
      toast.error("Failed to complete processing batch")
    }
  }

  // Create new processing batch
  const handleCreateBatch = async () => {
    if (!africycle || !address || selectedCollections.length === 0) return

    try {
      const collectionIds = selectedCollections.map(c => c.id)
      const processDescription = "New processing batch created from verified collections"
      
      await africycle.createProcessingBatch(address, collectionIds, processDescription)
      toast.success("Processing batch created")

      // Refresh batches
      // Note: This is a placeholder. You'll need to implement proper batch refresh
      setSelectedCollections([])
    } catch (error) {
      console.error("Error creating batch:", error)
      toast.error("Failed to create processing batch")
    }
  }

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <Header
          heading="Processing Dashboard"
          text="Manage and track waste processing"
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">Active Batches</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={handleCreateBatch} disabled={selectedCollections.length === 0}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Batch
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading processing data...</p>
            </div>
          ) : (
            <>
              <ProcessingStats batches={processingBatches} />

              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">Processing Batches</h2>
                      <p className="text-sm text-muted-foreground">
                        Track and manage processing batches
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                        <IconSearch className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Search batches..."
                          className="border-0 p-0 focus-visible:ring-0"
                        />
                      </div>
                      <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="mt-6 space-y-6">
                    {processingBatches.map(batch => (
                      <ProcessingBatchCard
                        key={batch.id}
                        batch={batch}
                        onComplete={handleCompleteBatch}
                      />
                    ))}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold">Processing Guidelines</h2>
                  <p className="text-sm text-muted-foreground">
                    Standard procedures for material processing
                  </p>
                  <div className="mt-6 space-y-4">
                    <Guideline
                      number="1"
                      title="Batch Creation"
                      description="Create processing batches from verified collections"
                    />
                    <Guideline
                      number="2"
                      title="Quality Control"
                      description="Maintain high quality standards during processing"
                    />
                    <Guideline
                      number="3"
                      title="Carbon Tracking"
                      description="Track and report carbon offset for each batch"
                    />
                    <Guideline
                      number="4"
                      title="Documentation"
                      description="Keep detailed records of processing outcomes"
                    />
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  )
} 