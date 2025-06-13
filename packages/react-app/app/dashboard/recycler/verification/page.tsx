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
} from "@tabler/icons-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useState, memo } from "react"
import { Header } from "@/components/dashboard/header"

interface VerificationItemProps {
  id: string
  collector: string
  material: string
  weight: string
  date: string
  location: string
  waitingTime: string
}

function VerificationItem({
  id,
  collector,
  material,
  weight,
  date,
  location,
  waitingTime,
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
            <Button variant="outline" className="text-red-600 hover:text-red-600">
              <IconX className="mr-2 h-4 w-4" />
              Reject
            </Button>
            <Button>
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

type ProcessingStatus = 'pending' | 'in_progress' | 'completed' | 'failed'
type ProcessingStage = 'verification' | 'sorting' | 'processing' | 'packaging' | 'shipping'

interface ProcessingItem {
  id: string
  collectionId: string
  material: string
  weight: string
  status: ProcessingStatus
  currentStage: ProcessingStage
  progress: number
  startDate: string
  estimatedCompletion: string
  location: string
  notes?: string
}

const ProcessingItem = memo(({ 
  item,
  onUpdateStatus
}: { 
  item: ProcessingItem
  onUpdateStatus: (id: string, status: ProcessingStatus) => void
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
              <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                {item.status.replace('_', ' ')}
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
                onClick={() => onUpdateStatus(item.id, 'completed')}
                disabled={item.status === 'completed'}
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
            {item.status === 'in_progress' && (
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

const ProcessingStats = memo(({ items }: { items: ProcessingItem[] }) => {
  const totalItems = items.length
  const completedItems = items.filter(item => item.status === 'completed').length
  const inProgressItems = items.filter(item => item.status === 'in_progress').length
  const pendingItems = items.filter(item => item.status === 'pending').length
  const failedItems = items.filter(item => item.status === 'failed').length

  const averageProgress = items.reduce((sum, item) => sum + item.progress, 0) / totalItems

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Processing"
        value={totalItems.toString()}
        description="Active items"
        color="text-blue-600"
      />
      <StatCard
        title="Completed"
        value={completedItems.toString()}
        description="Successfully processed"
        color="text-green-600"
      />
      <StatCard
        title="In Progress"
        value={inProgressItems.toString()}
        description="Currently processing"
        color="text-yellow-600"
      />
      <StatCard
        title="Average Progress"
        value={`${Math.round(averageProgress)}%`}
        description="Overall completion"
        color="text-purple-600"
      />
    </div>
  )
})
ProcessingStats.displayName = 'ProcessingStats'

export default function MaterialVerificationPage() {
  const [activeTab, setActiveTab] = useState("verification")
  const [processingItems, setProcessingItems] = useState<ProcessingItem[]>([
    {
      id: "1",
      collectionId: "COL-2023-0123",
      material: "Plastic",
      weight: "5kg",
      status: "in_progress",
      currentStage: "processing",
      progress: 65,
      startDate: "2 days ago",
      estimatedCompletion: "Tomorrow",
      location: "Nairobi Central",
      notes: "Material is being processed for recycling. Quality check passed."
    },
    {
      id: "2",
      collectionId: "COL-2023-0124",
      material: "E-Waste",
      weight: "3kg",
      status: "pending",
      currentStage: "verification",
      progress: 20,
      startDate: "1 day ago",
      estimatedCompletion: "In 3 days",
      location: "Westlands"
    },
    {
      id: "3",
      collectionId: "COL-2023-0125",
      material: "Metal",
      weight: "7kg",
      status: "completed",
      currentStage: "shipping",
      progress: 100,
      startDate: "5 days ago",
      estimatedCompletion: "Completed",
      location: "Eastleigh",
      notes: "Successfully processed and shipped to recycling facility."
    }
  ])

  const handleUpdateStatus = (id: string, status: ProcessingStatus) => {
    setProcessingItems(items =>
      items.map(item =>
        item.id === id
          ? { ...item, status, progress: status === 'completed' ? 100 : item.progress }
          : item
      )
    )
  }

  return (
    <DashboardShell>
      <Header
        heading="Material Verification & Processing"
        text="Verify and process collected materials"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="verification">Verification Queue</TabsTrigger>
          <TabsTrigger value="processing">Processing Status</TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Verification Queue</h2>
                  <p className="text-sm text-muted-foreground">
                    Pending material verifications
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <Button variant="outline">
                    <IconFilter className="mr-2 h-4 w-4" />
                    Filter
                  </Button>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Button variant="outline" className="text-sm">
                  Pending (12)
                </Button>
                <Button variant="outline" className="text-sm">
                  Verified (28)
                </Button>
                <Button variant="outline" className="text-sm">
                  Rejected (5)
                </Button>
              </div>
              <div className="mt-6 space-y-6">
                <VerificationItem
                  id="COL-2023-0123"
                  collector="John Doe"
                  material="Plastic"
                  weight="5kg"
                  date="2023-03-20"
                  location="Nairobi Central"
                  waitingTime="2 hours"
                />
                <VerificationItem
                  id="COL-2023-0124"
                  collector="Jane Smith"
                  material="E-Waste"
                  weight="3kg"
                  date="2023-03-19"
                  location="Westlands"
                  waitingTime="2 hours"
                />
                <VerificationItem
                  id="COL-2023-0125"
                  collector="Robert Johnson"
                  material="Metal"
                  weight="7kg"
                  date="2023-03-18"
                  location="Eastleigh"
                  waitingTime="2 hours"
                />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="outline">Previous</Button>
                <span className="text-sm text-muted-foreground">Page 1 of 3</span>
                <Button variant="outline">Next</Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold">Verification Statistics</h2>
                <p className="text-sm text-muted-foreground">
                  Overview of material verification activity
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <StatCard
                    title="Pending"
                    value="12"
                    description="Collections"
                    color="text-yellow-600"
                  />
                  <StatCard
                    title="Verified Today"
                    value="8"
                    description="Collections"
                    color="text-green-600"
                  />
                  <StatCard
                    title="Rejected Today"
                    value="2"
                    description="Collections"
                    color="text-red-600"
                  />
                  <StatCard
                    title="Avg. Response Time"
                    value="1.5h"
                    description="Per verification"
                  />
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold">Verification Guidelines</h2>
                <p className="text-sm text-muted-foreground">
                  Standard procedures for material verification
                </p>
                <div className="mt-6 space-y-4">
                  <Guideline
                    number="1"
                    title="Check Photo Evidence"
                    description="Verify that before and after photos clearly show the collected waste"
                  />
                  <Guideline
                    number="2"
                    title="Confirm Material Type"
                    description="Ensure the material type matches what is visible in the photos"
                  />
                  <Guideline
                    number="3"
                    title="Validate Weight"
                    description="Check that the claimed weight is reasonable for the amount shown"
                  />
                  <Guideline
                    number="4"
                    title="Provide Feedback"
                    description="Always include constructive feedback, especially for rejections"
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <ProcessingStats items={processingItems} />

          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Processing Queue</h2>
                  <p className="text-sm text-muted-foreground">
                    Track material processing status
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                    <IconSearch className="h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="border-0 p-0 focus-visible:ring-0"
                    />
                  </div>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                {processingItems.map(item => (
                  <ProcessingItem
                    key={item.id}
                    item={item}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <Button variant="outline">Previous</Button>
                <span className="text-sm text-muted-foreground">Page 1 of 2</span>
                <Button variant="outline">Next</Button>
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
                  title="Sorting & Classification"
                  description="Properly sort materials by type and quality before processing"
                />
                <Guideline
                  number="2"
                  title="Processing Standards"
                  description="Follow industry standards for material processing and recycling"
                />
                <Guideline
                  number="3"
                  title="Quality Control"
                  description="Regular quality checks during processing to ensure standards"
                />
                <Guideline
                  number="4"
                  title="Documentation"
                  description="Maintain detailed records of processing stages and outcomes"
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
} 