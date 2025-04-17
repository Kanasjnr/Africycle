"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CollectionRecordProps {
  id: string
  date: string
  type: string
  weight: string
  location: string
  status: "Pending" | "Verified" | "Rejected"
  verificationProgress?: number
}

function CollectionRecord({
  id,
  date,
  type,
  weight,
  location,
  status,
  verificationProgress,
}: CollectionRecordProps) {
  return (
    <div className="border-b py-4 last:border-0">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{id}</h3>
            <Badge
              variant={
                status === "Pending"
                  ? "secondary"
                  : status === "Verified"
                  ? "default"
                  : "destructive"
              }
            >
              {status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="font-medium">Type</p>
          <p className="text-muted-foreground">{type}</p>
        </div>
        <div>
          <p className="font-medium">Weight</p>
          <p className="text-muted-foreground">{weight}</p>
        </div>
        <div>
          <p className="font-medium">Location</p>
          <p className="text-muted-foreground">{location}</p>
        </div>
      </div>
      {verificationProgress !== undefined && (
        <div className="mt-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Verification Progress</span>
            <span className="font-medium">{verificationProgress}%</span>
          </div>
          <Progress value={verificationProgress} />
        </div>
      )}
      <div className="mt-4">
        <Button variant="outline" size="sm">View Details</Button>
      </div>
    </div>
  )
}

export default function CollectionHistoryPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Collection History"
        text="View and manage your waste collection records"
      />
      <div className="grid gap-6">
        {/* Collection Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Collections
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">31</span>
                <Badge variant="secondary">This Month</Badge>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Weight
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">235kg</span>
                <Badge variant="secondary">This Month</Badge>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Verification Rate
              </h3>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold">90%</span>
                <Badge variant="secondary">28/31 Verified</Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Collection Records */}
        <Card>
          <div className="p-6">
            <Tabs defaultValue="pending">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Collection Records</h2>
                  <p className="text-sm text-muted-foreground">
                    View all your collection records and their status
                  </p>
                </div>
                <TabsList>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </div>
              <div className="mt-4">
                <TabsContent value="pending" className="space-y-4">
                  <CollectionRecord
                    id="COL-2023-0123"
                    date="2023-03-20"
                    type="Plastic"
                    weight="5kg"
                    location="Nairobi Central"
                    status="Pending"
                    verificationProgress={50}
                  />
                  <CollectionRecord
                    id="COL-2023-0124"
                    date="2023-03-19"
                    type="E-Waste"
                    weight="3kg"
                    location="Westlands"
                    status="Pending"
                    verificationProgress={50}
                  />
                  <CollectionRecord
                    id="COL-2023-0125"
                    date="2023-03-18"
                    type="Metal"
                    weight="7kg"
                    location="Eastleigh"
                    status="Pending"
                    verificationProgress={50}
                  />
                </TabsContent>
                <TabsContent value="recent" className="space-y-4">
                  <CollectionRecord
                    id="COL-2023-0122"
                    date="2023-03-17"
                    type="Paper"
                    weight="4kg"
                    location="Nairobi Central"
                    status="Verified"
                  />
                  <CollectionRecord
                    id="COL-2023-0121"
                    date="2023-03-16"
                    type="Plastic"
                    weight="6kg"
                    location="Westlands"
                    status="Verified"
                  />
                </TabsContent>
                <TabsContent value="rejected" className="space-y-4">
                  <CollectionRecord
                    id="COL-2023-0120"
                    date="2023-03-15"
                    type="Metal"
                    weight="8kg"
                    location="Eastleigh"
                    status="Rejected"
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 