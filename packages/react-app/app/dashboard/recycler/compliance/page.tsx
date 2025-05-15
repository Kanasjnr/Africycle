"use client"

import { DashboardHeader } from "@/components/dashboard/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { IconShield, IconAlertCircle, IconCheck, IconClock } from "@tabler/icons-react"

const complianceItems = [
  {
    id: "ENV-001",
    title: "Environmental Impact Assessment",
    status: "Compliant",
    dueDate: "2024-12-31",
    progress: 100,
    description: "Annual environmental impact assessment report",
    requirements: [
      "Waste management plan",
      "Emissions monitoring",
      "Resource consumption tracking",
    ],
  },
  {
    id: "SAF-002",
    title: "Safety Certification",
    status: "Pending",
    dueDate: "2024-06-30",
    progress: 75,
    description: "Workplace safety and equipment certification",
    requirements: [
      "Safety equipment inspection",
      "Staff training records",
      "Emergency response plan",
    ],
  },
  {
    id: "DOC-003",
    title: "Documentation Compliance",
    status: "At Risk",
    dueDate: "2024-04-15",
    progress: 45,
    description: "Required documentation and permits",
    requirements: [
      "Waste handling permits",
      "Transportation licenses",
      "Processing certifications",
    ],
  },
  {
    id: "REP-004",
    title: "Quarterly Report",
    status: "Not Started",
    dueDate: "2024-03-31",
    progress: 0,
    description: "Q1 2024 recycling operations report",
    requirements: [
      "Collection statistics",
      "Processing efficiency",
      "Environmental metrics",
    ],
  },
]

export default function CompliancePage() {
  return (
    <>
      <DashboardHeader
        heading="Compliance Management"
        text="Track and manage your regulatory compliance requirements"
      />

      <div className="grid gap-6">
        {/* Compliance Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Overall Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <Progress value={85} className="mt-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                3 of 4 requirements met
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Due within 30 days
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                At Risk Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Compliant Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="mt-2 text-xs text-muted-foreground">
                Fully compliant
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Items */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {complianceItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.title}</h3>
                        <Badge
                          variant={
                            item.status === "Compliant"
                              ? "default"
                              : item.status === "Pending"
                              ? "secondary"
                              : item.status === "At Risk"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <IconClock className="h-4 w-4" />
                        <span>Due: {item.dueDate}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{item.progress}%</span>
                    </div>
                    <Progress value={item.progress} />
                  </div>

                  <div className="mt-4">
                    <h4 className="text-sm font-medium">Requirements</h4>
                    <ul className="mt-2 space-y-2">
                      {item.requirements.map((req, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          {item.progress === 100 ? (
                            <IconCheck className="h-4 w-4 text-green-500" />
                          ) : item.status === "At Risk" ? (
                            <IconAlertCircle className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <IconShield className="h-4 w-4" />
                          )}
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Stay Updated</h3>
                <p className="text-sm text-muted-foreground">
                  Regularly check for updates to environmental regulations and compliance requirements
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Document Everything</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain detailed records of all compliance-related activities and certifications
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Plan Ahead</h3>
                <p className="text-sm text-muted-foreground">
                  Set up reminders for upcoming deadlines and start preparations early
                </p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <h3 className="font-medium">Regular Audits</h3>
                <p className="text-sm text-muted-foreground">
                  Conduct internal audits to identify and address compliance gaps
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
} 