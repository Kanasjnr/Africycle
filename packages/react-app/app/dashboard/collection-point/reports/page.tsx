"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  IconFileAnalytics,
  IconDownload,
  IconShare,
  IconCalendar,
  IconFilter,
  IconSearch,
  IconFile,
  IconFileText,
} from "@tabler/icons-react"

interface ReportCardProps {
  title: string
  description: string
  type: "analytics" | "spreadsheet" | "pdf" | "text"
  date: string
  size: string
  status: "Generated" | "Processing" | "Failed"
}

function ReportCard({
  title,
  description,
  type,
  date,
  size,
  status,
}: ReportCardProps) {
  const getIcon = () => {
    switch (type) {
      case "analytics":
        return <IconFileAnalytics className="h-8 w-8 text-blue-500" />
      case "spreadsheet":
        return <IconFile className="h-8 w-8 text-green-500" />
      case "pdf":
        return <IconFile className="h-8 w-8 text-red-500" />
      case "text":
        return <IconFileText className="h-8 w-8 text-gray-500" />
    }
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start gap-4">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{title}</h3>
              <Badge
                variant={
                  status === "Generated"
                    ? "default"
                    : status === "Processing"
                    ? "secondary"
                    : "destructive"
                }
              >
                {status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span>{date}</span>
              <span>{size}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" size="sm">
            <IconShare className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default function ReportsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Reports"
        text="Generate and manage collection point reports"
      />
      <div className="grid gap-6">
        {/* Report Generation */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold">Generate New Report</h2>
            <p className="text-sm text-muted-foreground">
              Select report type and parameters
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Button>
                <IconFileAnalytics className="mr-2 h-4 w-4" />
                Analytics Report
              </Button>
              <Button variant="outline">
                <IconFile className="mr-2 h-4 w-4" />
                Collection Data
              </Button>
              <Button variant="outline">
                <IconFile className="mr-2 h-4 w-4" />
                Performance Summary
              </Button>
            </div>
          </div>
        </Card>

        {/* Report List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Reports</h2>
                <p className="text-sm text-muted-foreground">
                  View and download generated reports
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex w-[200px] items-center gap-2 rounded-md border px-3">
                  <IconSearch className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search reports..."
                    className="border-0 p-0 focus-visible:ring-0"
                  />
                </div>
                <Button variant="outline">
                  <IconCalendar className="mr-2 h-4 w-4" />
                  Date Range
                </Button>
                <Button variant="outline">
                  <IconFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <ReportCard
                title="Monthly Analytics Report"
                description="Detailed analysis of collection metrics and trends"
                type="analytics"
                date="March 2024"
                size="2.5 MB"
                status="Generated"
              />
              <ReportCard
                title="Collection Data Export"
                description="Raw data export of all collections"
                type="spreadsheet"
                date="March 15, 2024"
                size="1.8 MB"
                status="Generated"
              />
              <ReportCard
                title="Quarterly Performance Report"
                description="Q1 2024 performance metrics and insights"
                type="pdf"
                date="March 31, 2024"
                size="3.2 MB"
                status="Processing"
              />
              <ReportCard
                title="System Logs"
                description="Collection point activity logs"
                type="text"
                date="March 20, 2024"
                size="500 KB"
                status="Generated"
              />
            </div>
          </div>
        </Card>
      </div>
    </DashboardShell>
  )
} 