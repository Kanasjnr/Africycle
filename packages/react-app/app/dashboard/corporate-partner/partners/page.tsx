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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Filter, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample data - replace with actual data from API
const partners = [
  {
    id: 1,
    name: "Central Collection Hub",
    type: "collection_point",
    location: "Nairobi, Kenya",
    status: "active",
    contactPerson: "John Doe",
    email: "john@centralhub.com",
    phone: "+254 123 456 789",
    materials: ["PET", "HDPE", "PP"],
    monthlyVolume: "2,500 kg",
    collectors: 12,
    lastCollection: "2024-03-20",
    performance: {
      collectionRate: "95%",
      qualityScore: "4.8/5",
      onTimeDelivery: "98%",
    },
  },
  {
    id: 2,
    name: "EcoRecycle Kenya",
    type: "recycler",
    location: "Nairobi, Kenya",
    status: "active",
    contactPerson: "Jane Smith",
    email: "jane@ecorecycle.com",
    phone: "+254 987 654 321",
    materials: ["PET", "HDPE", "PP", "MLP"],
    processingCapacity: "5,000 kg/day",
    certification: "ISO 14001",
    lastDelivery: "2024-03-20",
    performance: {
      processingRate: "92%",
      qualityScore: "4.9/5",
      onTimeDelivery: "95%",
    },
  },
  // Add more partners as needed
];

export default function PartnersPage() {
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
        <h1 className="text-3xl font-bold">Partners</h1>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/dashboard/corporate-partner/supply-chain/add-partner")}>
            Add New Partner
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Partners</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search partners..." className="pl-8" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Partners</TabsTrigger>
              <TabsTrigger value="collection_points">Collection Points</TabsTrigger>
              <TabsTrigger value="recyclers">Recyclers</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {partner.type === "collection_point" ? "Collection Point" : "Recycler"}
                        </Badge>
                      </TableCell>
                      <TableCell>{partner.location}</TableCell>
                      <TableCell>
                        <Badge variant={partner.status === "active" ? "default" : "secondary"}>
                          {partner.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{partner.contactPerson}</p>
                          <p className="text-xs text-muted-foreground">{partner.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {partner.type === "collection_point"
                              ? `Collection Rate: ${partner.performance.collectionRate}`
                              : `Processing Rate: ${partner.performance.processingRate}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Quality Score: {partner.performance.qualityScore}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/corporate-partner/partners/${partner.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/corporate-partner/partners/${partner.id}/edit`)}>
                              Edit Partner
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              Remove Partner
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="collection_points">
              {/* Similar table structure but filtered for collection points */}
            </TabsContent>
            <TabsContent value="recyclers">
              {/* Similar table structure but filtered for recyclers */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 