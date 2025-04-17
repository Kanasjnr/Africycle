"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCamera, IconUpload } from "@tabler/icons-react"

interface ScanItemProps {
  id: string
  location: string
  timestamp: string
}

function ScanItem({ id, location, timestamp }: ScanItemProps) {
  return (
    <div className="flex items-center justify-between border-b py-4 last:border-0">
      <div>
        <p className="font-medium">{id}</p>
        <p className="text-sm text-muted-foreground">{location}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
      <Button variant="outline" size="sm">View</Button>
    </div>
  )
}

export default function QRScannerPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="QR Scanner"
        text="Scan QR codes at collection points"
      />
      <div className="grid gap-6">
        {/* Scanner */}
        <Card>
          <div className="aspect-video relative flex items-center justify-center border-b">
            <div className="text-center">
              <p className="text-muted-foreground">Camera feed will appear here</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 p-4">
            <Button variant="outline">
              <IconUpload className="mr-2 h-4 w-4" />
              Upload QR Code
            </Button>
            <Button>
              <IconCamera className="mr-2 h-4 w-4" />
              Start Scanning
            </Button>
          </div>
        </Card>

        {/* Scanner Instructions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Scanner Instructions</h2>
            <p className="text-sm text-muted-foreground">How to use the QR scanner</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium">1. Position the QR Code</h3>
                <p className="text-sm text-muted-foreground">
                  Ensure the QR code is within the scanning frame and well-lit
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium">2. Hold Steady</h3>
                <p className="text-sm text-muted-foreground">
                  Keep your device steady until the scan is complete
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium">3. Confirm Details</h3>
                <p className="text-sm text-muted-foreground">
                  Verify the scanned information is correct before proceeding
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="font-medium">4. Complete Collection</h3>
                <p className="text-sm text-muted-foreground">
                  Follow the prompts to complete your waste collection record
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Scans */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Recent Scans</h2>
            <p className="text-sm text-muted-foreground">Your recently scanned QR codes</p>
            <div className="mt-4">
              <ScanItem
                id="QR-2023-0045"
                location="Collection Point • Nairobi Central"
                timestamp="Today, 10:23 AM"
              />
              <ScanItem
                id="QR-2023-0044"
                location="Waste Bag • Westlands"
                timestamp="Yesterday, 3:45 PM"
              />
              <ScanItem
                id="QR-2023-0043"
                location="Collection Point • Eastleigh"
                timestamp="Mar 18, 2023, 11:30 AM"
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 