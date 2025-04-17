"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  IconCertificate,
  IconCalendar,
  IconDownload,
  IconUpload,
  IconRefresh,
} from "@tabler/icons-react"

interface CertificationCardProps {
  title: string
  issuer: string
  issuedDate: string
  expiryDate: string
  status: "Active" | "Pending" | "Expired"
  progress?: number
  description: string
}

function CertificationCard({
  title,
  issuer,
  issuedDate,
  expiryDate,
  status,
  progress,
  description,
}: CertificationCardProps) {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <IconCertificate className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{title}</h3>
              <p className="text-sm text-muted-foreground">
                Issued by {issuer}
              </p>
            </div>
          </div>
          <Badge
            variant={
              status === "Active"
                ? "default"
                : status === "Pending"
                ? "secondary"
                : "destructive"
            }
          >
            {status}
          </Badge>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <IconCalendar className="h-4 w-4" />
            <span>Issued: {issuedDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <IconCalendar className="h-4 w-4" />
            <span>Expires: {expiryDate}</span>
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Application Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Download
          </Button>
          {status === "Active" && (
            <Button variant="outline" size="sm">
              <IconRefresh className="mr-2 h-4 w-4" />
              Renew
        </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function CertificationsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Certifications"
        text="Manage your environmental and sustainability certifications"
      />
      <div className="grid gap-6">
        {/* Actions */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Certification Actions</h2>
                <p className="text-sm text-muted-foreground">
                  Apply for new certifications or renew existing ones
                </p>
              </div>
              <Button>
                <IconUpload className="mr-2 h-4 w-4" />
                Apply for New
              </Button>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <h3 className="font-medium">Recommended Certifications</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Based on your current sustainability metrics
              </p>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">
                  Green Business
                </Button>
                <Button variant="outline" size="sm">
                  Carbon Neutral
                </Button>
                <Button variant="outline" size="sm">
                  Zero Waste
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Active Certifications */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Active Certifications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <CertificationCard
              title="ISO 14001:2015"
              issuer="International Organization for Standardization"
              issuedDate="Jan 15, 2023"
              expiryDate="Jan 15, 2024"
              status="Active"
              description="Environmental Management System certification demonstrating commitment to environmental responsibility"
            />
            <CertificationCard
              title="Green Business Certification"
              issuer="Environmental Protection Agency"
              issuedDate="Mar 1, 2023"
              expiryDate="Mar 1, 2024"
              status="Active"
              description="Recognition of sustainable business practices and environmental stewardship"
            />
            <CertificationCard
              title="Carbon Trust Standard"
              issuer="Carbon Trust"
              issuedDate="Dec 20, 2022"
              expiryDate="Dec 20, 2023"
              status="Active"
              description="Certification for demonstrating reduction in carbon emissions and environmental impact"
            />
          </div>
        </div>

        {/* Pending Certifications */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Pending Applications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <CertificationCard
              title="Sustainable Supply Chain"
              issuer="Global Sustainability Initiative"
              issuedDate="Feb 10, 2023"
              expiryDate="N/A"
              status="Pending"
              progress={65}
              description="Certification for sustainable and ethical supply chain management practices"
            />
            <CertificationCard
              title="Zero Waste Certification"
              issuer="Zero Waste International Alliance"
              issuedDate="Mar 15, 2023"
              expiryDate="N/A"
              status="Pending"
              progress={40}
              description="Recognition of commitment to zero waste principles and practices"
            />
          </div>
        </div>

        {/* Expired Certifications */}
        <div>
          <h2 className="mb-4 text-lg font-semibold">Expired Certifications</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <CertificationCard
              title="Energy Star Certification"
              issuer="Environmental Protection Agency"
              issuedDate="Jan 1, 2022"
              expiryDate="Jan 1, 2023"
              status="Expired"
              description="Recognition of superior energy efficiency in operations and facilities"
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
} 