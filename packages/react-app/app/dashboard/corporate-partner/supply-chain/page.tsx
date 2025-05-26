'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRole } from "@/providers/RoleProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Sample data - replace with actual data from API
const collectionPoints = [
  {
    id: 1,
    name: "Central Collection Hub",
    location: "Nairobi, Kenya",
    status: "active",
    collectors: 12,
    monthlyVolume: "2,500 kg",
    materials: ["PET", "HDPE", "PP"],
    lastCollection: "2024-03-20",
  },
  {
    id: 2,
    name: "West Region Center",
    location: "Mombasa, Kenya",
    status: "active",
    collectors: 8,
    monthlyVolume: "1,800 kg",
    materials: ["PET", "HDPE", "MLP"],
    lastCollection: "2024-03-19",
  },
  {
    id: 3,
    name: "East Region Center",
    location: "Kisumu, Kenya",
    status: "maintenance",
    collectors: 6,
    monthlyVolume: "1,200 kg",
    materials: ["PET", "HDPE"],
    lastCollection: "2024-03-18",
  },
];

const recyclers = [
  {
    id: 1,
    name: "EcoRecycle Kenya",
    location: "Nairobi, Kenya",
    status: "active",
    processingCapacity: "5,000 kg/day",
    materials: ["PET", "HDPE", "PP", "MLP"],
    certification: "ISO 14001",
    lastDelivery: "2024-03-20",
  },
  {
    id: 2,
    name: "GreenTech Recycling",
    location: "Mombasa, Kenya",
    status: "active",
    processingCapacity: "3,000 kg/day",
    materials: ["PET", "HDPE"],
    certification: "ISO 14001",
    lastDelivery: "2024-03-19",
  },
];

export default function SupplyChainPage() {
  const { isRegistered, role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isRegistered || role !== "corporate_partner") {
      router.push("/");
    }
  }, [isRegistered, role, router]);

  if (!isRegistered || role !== "corporate_partner") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Supply Chain Management</h1>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/dashboard/corporate-partner/supply-chain/add-partner")}>
            Add New Partner
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collection Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 active, 1 maintenance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recyclers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              All certified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Collection Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,500 kg</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Supply Chain Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              On-time delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collection Points</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monthly Volume</TableHead>
                  <TableHead>Last Collection</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {collectionPoints.map((point) => (
                  <TableRow key={point.id}>
                    <TableCell className="font-medium">{point.name}</TableCell>
                    <TableCell>{point.location}</TableCell>
                    <TableCell>
                      <Badge variant={point.status === "active" ? "default" : "secondary"}>
                        {point.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{point.monthlyVolume}</TableCell>
                    <TableCell>{new Date(point.lastCollection).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recyclers</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Last Delivery</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recyclers.map((recycler) => (
                  <TableRow key={recycler.id}>
                    <TableCell className="font-medium">{recycler.name}</TableCell>
                    <TableCell>{recycler.location}</TableCell>
                    <TableCell>
                      <Badge variant={recycler.status === "active" ? "default" : "secondary"}>
                        {recycler.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{recycler.processingCapacity}</TableCell>
                    <TableCell>{new Date(recycler.lastDelivery).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Material Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">Material flow tracking is currently being implemented</p>
              <p className="text-sm text-muted-foreground">This feature will show the complete journey of recycled materials from collection to processing</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 