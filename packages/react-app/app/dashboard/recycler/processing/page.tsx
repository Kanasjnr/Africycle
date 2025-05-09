"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconClipboard,
  IconFileCheck,
  IconUpload,
  IconDownload,
} from "@tabler/icons-react"

interface ProcessingItemProps {
  id: string
  material: string
  weight: string
  stage: "Sorting" | "Cleaning" | "Completed" | "Scheduled"
  progress: number
  startDate: string
  estimatedCompletion: string
}

function ProcessingItem({
  id,
  material,
  weight,
  stage,
  progress,
  startDate,
  estimatedCompletion,
}: ProcessingItemProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{id}</h3>
              <Badge variant={
                stage === "Completed" ? "default" :
                stage === "Scheduled" ? "secondary" :
                "primary"
              }>{stage}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {material} • {weight}
            </p>
          </div>
          <Button variant="secondary" size="sm">
            <IconClipboard className="mr-2 h-4 w-4" />
            View Details
          </Button>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Processing Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>Started: {startDate}</span>
          <span>Est. Completion: {estimatedCompletion}</span>
        </div>
      </div>
    </Card>
  )
}

interface DocumentProps {
  title: string
  type: string
  date: string
  status: "Verified" | "Pending" | "Rejected"
}

function Document({ title, type, date, status }: DocumentProps) {
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div>
        <div className="flex items-center gap-2">
          <IconFileCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">{title}</h3>
          <Badge
            variant={
              status === "Verified"
                ? "primary"
                : status === "Pending"
                ? "secondary"
                : "destructive"
            }
          >
            {status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {type} • {date}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">
          <IconDownload className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button variant="default" size="sm">
          <IconUpload className="mr-2 h-4 w-4" />
          Update
        </Button>
      </div>
    </div>
  )
}

export default function ProcessingPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Material Processing"
        text="Track and document material processing activities"
      />
      <div className="grid gap-6">
        <Card>
          <div className="p-6">
            <Tabs defaultValue="active">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Processing Status</h2>
                  <p className="text-sm text-muted-foreground">
                    Current material processing activities
                  </p>
                </div>
                <TabsList className="bg-secondary">
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                </TabsList>
              </div>
              <div className="mt-6">
                <TabsContent value="active" className="space-y-4">
                  <ProcessingItem
                    id="PRC-2023-0123"
                    material="PET Plastic"
                    weight="500 kg"
                    stage="Sorting"
                    progress={35}
                    startDate="Mar 20, 2023"
                    estimatedCompletion="Mar 25, 2023"
                  />
                  <ProcessingItem
                    id="PRC-2023-0124"
                    material="HDPE"
                    weight="300 kg"
                    stage="Cleaning"
                    progress={65}
                    startDate="Mar 19, 2023"
                    estimatedCompletion="Mar 23, 2023"
                  />
                </TabsContent>
                <TabsContent value="completed" className="space-y-4">
                  <ProcessingItem
                    id="PRC-2023-0121"
                    material="Paper"
                    weight="400 kg"
                    stage="Completed"
                    progress={100}
                    startDate="Mar 15, 2023"
                    estimatedCompletion="Mar 18, 2023"
                  />
                </TabsContent>
                <TabsContent value="scheduled" className="space-y-4">
                  <ProcessingItem
                    id="PRC-2023-0125"
                    material="Mixed Plastics"
                    weight="600 kg"
                    stage="Scheduled"
                    progress={0}
                    startDate="Mar 25, 2023"
                    estimatedCompletion="Mar 30, 2023"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>

        {/* Documentation */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Processing Documentation</h2>
                <p className="text-sm text-muted-foreground">
                  Manage processing certificates and documentation
                </p>
              </div>
              <Button variant="default">
                <IconUpload className="mr-2 h-4 w-4" />
                Upload New
              </Button>
            </div>
            <div className="mt-6 divide-y">
              <Document
                title="Quality Control Report"
                type="PDF Document"
                date="Mar 20, 2023"
                status="Verified"
              />
              <Document
                title="Processing Certificate"
                type="PDF Document"
                date="Mar 19, 2023"
                status="Pending"
              />
              <Document
                title="Material Analysis Report"
                type="PDF Document"
                date="Mar 18, 2023"
                status="Verified"
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 