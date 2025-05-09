"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { IconCamera, IconUpload, IconCheck, IconX } from "@tabler/icons-react"

interface VerificationSubmissionProps {
  id: string
  date: string
  material: string
  weight: string
  status: "Pending" | "Verified" | "Rejected"
  feedback?: string
}

function VerificationSubmission({
  id,
  date,
  material,
  weight,
  status,
  feedback,
}: VerificationSubmissionProps) {
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
          <p className="text-sm text-muted-foreground">
            {date} • {material} • {weight}
          </p>
        </div>
      </div>
      {feedback && (
        <div className="mt-2 rounded-lg bg-muted p-3">
          <div className="flex items-center gap-2">
            {status === "Verified" ? (
              <IconCheck className="h-4 w-4 text-green-500" />
            ) : (
              <IconX className="h-4 w-4 text-red-500" />
            )}
            <p className="text-sm">{feedback}</p>
          </div>
        </div>
      )}
      <div className="mt-4">
        <Button variant="outline" size="sm">View Details</Button>
        {status === "Rejected" && (
          <Button size="sm" className="ml-2">Resubmit</Button>
        )}
      </div>
    </div>
  )
}

export default function PhotoVerificationPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Photo Verification"
        text="Upload photos to verify your waste collections"
      />
      <div className="grid gap-6">
        {/* Upload Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Upload Verification Photos</h2>
            <p className="text-sm text-muted-foreground">
              Take or upload photos of your collected waste
            </p>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="text-sm font-medium">Collection ID</label>
                <Input placeholder="Enter collection ID" />
              </div>
              <div>
                <label className="text-sm font-medium">Waste Type</label>
                <Input placeholder="E.g., Plastic, Metal, E-Waste" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Briefly describe the collected waste"
                  className="h-24"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Before Collection Photo</label>
                  <div className="mt-2 flex aspect-video items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                      <IconUpload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag & drop or click to upload
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">After Collection Photo</label>
                  <div className="mt-2 flex aspect-video items-center justify-center rounded-lg border border-dashed">
                    <div className="text-center">
                      <IconUpload className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag & drop or click to upload
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <IconCamera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button>Submit for Verification</Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Verification Guidelines */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Verification Guidelines</h2>
            <p className="text-sm text-muted-foreground">
              Follow these guidelines for successful verification
            </p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">1. Clear Photos</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure photos are clear, well-lit, and show the waste clearly
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">2. Before & After</h3>
                <p className="text-sm text-muted-foreground">
                  Take photos both before and after collection for comparison
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">3. Include Scale Reference</h3>
                <p className="text-sm text-muted-foreground">
                  Include an object for scale reference when possible
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">4. Accurate Description</h3>
                <p className="text-sm text-muted-foreground">
                  Provide accurate details about the waste type and quantity
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Recent Verification Submissions</h2>
            <p className="text-sm text-muted-foreground">
              Status of your recent verification submissions
            </p>
            <div className="mt-4 divide-y">
              <VerificationSubmission
                id="VER-2023-0045"
                date="Mar 20, 2023"
                material="Plastic"
                weight="5kg"
                status="Pending"
              />
              <VerificationSubmission
                id="VER-2023-0044"
                date="Mar 18, 2023"
                material="E-Waste"
                weight="3kg"
                status="Verified"
                feedback="Good quality photos, clear evidence of collection."
              />
              <VerificationSubmission
                id="VER-2023-0043"
                date="Mar 15, 2023"
                material="Metal"
                weight="7kg"
                status="Rejected"
                feedback="Photos too blurry, unable to verify waste type."
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 