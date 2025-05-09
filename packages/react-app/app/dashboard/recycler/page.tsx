"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardShell } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  IconPackage,
  IconTruck,
  IconCoin,
  IconChartBar,
  IconArrowUpRight,
  IconArrowDownRight,
} from "@tabler/icons-react";

export default function RecyclerDashboardPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Recycler Dashboard"
        text="Track materials, manage processing, and handle marketplace listings"
      />
      <div className="grid gap-6">
        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconPackage className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Total Materials</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">2,450 kg</p>
              <div className="mt-2 flex items-center text-sm">
                <IconArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">+12%</span>
                <span className="ml-1 text-muted-foreground">from last month</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconTruck className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Processing Rate</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">85%</p>
              <div className="mt-2 flex items-center text-sm">
                <IconArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">+5%</span>
                <span className="ml-1 text-muted-foreground">from last month</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconCoin className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Revenue</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">$12,450</p>
              <div className="mt-2 flex items-center text-sm">
                <IconArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                <span className="text-green-500">+8%</span>
                <span className="ml-1 text-muted-foreground">from last month</span>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <IconChartBar className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-medium">Market Share</h3>
              </div>
              <p className="mt-2 text-2xl font-bold">24%</p>
              <div className="mt-2 flex items-center text-sm">
                <IconArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                <span className="text-red-500">-2%</span>
                <span className="ml-1 text-muted-foreground">from last month</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Material Processing */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Material Processing</h2>
                  <p className="text-sm text-muted-foreground">
                    Current processing status
                  </p>
                </div>
                <Button variant="outline">View All</Button>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge>Sorting</Badge>
                      <span className="text-sm text-muted-foreground">
                        PET Plastic
                      </span>
                    </div>
                    <span className="text-sm font-medium">35%</span>
                  </div>
                  <Progress value={35} className="mt-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge>Cleaning</Badge>
                      <span className="text-sm text-muted-foreground">
                        HDPE
                      </span>
                    </div>
                    <span className="text-sm font-medium">65%</span>
                  </div>
                  <Progress value={65} className="mt-2" />
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Quick Actions</h2>
                  <p className="text-sm text-muted-foreground">
                    Common tasks and operations
                  </p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <IconPackage className="h-5 w-5" />
                  <span>New Listing</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <IconTruck className="h-5 w-5" />
                  <span>Track Materials</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <IconChartBar className="h-5 w-5" />
                  <span>View Analytics</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 p-4">
                  <IconCoin className="h-5 w-5" />
                  <span>Manage Orders</span>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
} 
 