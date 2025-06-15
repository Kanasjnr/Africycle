"use client";

import { DashboardShell } from "@/components/dashboard/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/dashboard/header";
import { Loader } from "@/components/ui/loader";
import { useAfriCycle } from "@/hooks/useAfricycle";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { AfricycleStatus, AfricycleWasteStream } from "@/hooks/useAfricycle";
import { IconPackage, IconRecycle, IconShoppingCart, IconTruck, IconUsers, IconCoin, IconChartBar } from "@tabler/icons-react";
import { toast } from "sonner";

// Utility function to format wei to cUSD
function formatCUSD(weiValue: bigint): string {
  const divisor = BigInt(10 ** 18) // 18 decimal places for cUSD
  const cUSDValue = Number(weiValue) / Number(divisor)
  return cUSDValue.toFixed(3) // Show 3 decimal places
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, description, icon, color }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4">
        <div className={`rounded-lg p-3 ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-1 text-2xl font-bold">{value}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
}

interface ProgressCardProps {
  title: string;
  value: number;
  total: number;
  description: string;
  color: string;
}

function ProgressCard({ title, value, total, description, color }: ProgressCardProps) {
  const percentage = (value / total) * 100;
  return (
    <Card className="p-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span className="text-sm font-medium">{value}/{total}</span>
        </div>
        <Progress value={percentage} className={`h-2 ${color}`} />
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </Card>
  );
}

export default function RecyclerDashboard() {
  const { address } = useAccount();
  const africycle = useAfriCycle({
    contractAddress: process.env.NEXT_PUBLIC_AFRICYCLE_CONTRACT_ADDRESS as `0x${string}`,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://forno.celo.org"
  });

  const [stats, setStats] = useState({
    totalInventory: BigInt(0),
    totalEarnings: BigInt(0),
    activeCollectors: BigInt(0),
    scheduledPickups: BigInt(0),
    processedByType: [BigInt(0), BigInt(0), BigInt(0), BigInt(0)] as [bigint, bigint, bigint, bigint],
    inventoryByType: [BigInt(0), BigInt(0), BigInt(0), BigInt(0)] as [bigint, bigint, bigint, bigint],
    reputationScore: BigInt(0),
    activeListings: BigInt(0)
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!africycle || !address) return;

      try {
        setIsLoading(true);
        const profile = await africycle.getUserProfile(address);
        
        setStats({
          totalInventory: profile.totalInventory,
          totalEarnings: profile.recyclerTotalEarnings,
          activeCollectors: profile.activeCollectors,
          scheduledPickups: profile.scheduledPickups,
          processedByType: profile.processedByType,
          inventoryByType: profile.inventoryByType,
          reputationScore: profile.recyclerReputationScore,
          activeListings: profile.activeListings
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Failed to fetch dashboard statistics");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [africycle, address]);

  const totalProcessed = stats.processedByType.reduce((sum, val) => sum + val, BigInt(0));
  const totalInventory = stats.inventoryByType.reduce((sum, val) => sum + val, BigInt(0));

  return (
    <DashboardShell>
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <Loader 
            message="Loading dashboard statistics..." 
            size="lg"
            className="py-16"
          />
        ) : (
          <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              <StatCard
                title="Total Inventory"
                value={`${totalInventory.toString()} kg`}
                description="Current waste inventory"
                icon={<IconPackage className="h-6 w-6 text-white" />}
                color="bg-blue-500"
              />
              <StatCard
                title="Total Earnings"
                value={`${formatCUSD(stats.totalEarnings)} cUSD`}
                description="Total earnings from recycling"
                icon={<IconCoin className="h-6 w-6 text-white" />}
                color="bg-green-500"
              />
              <StatCard
                title="Active Collectors"
                value={stats.activeCollectors.toString()}
                description="Registered collectors"
                icon={<IconUsers className="h-6 w-6 text-white" />}
                color="bg-purple-500"
              />
              <StatCard
                title="Reputation Score"
                value={stats.reputationScore.toString()}
                description="Your recycler reputation"
                icon={<IconChartBar className="h-6 w-6 text-white" />}
                color="bg-yellow-500"
              />
            </div>

            {/* Progress Cards */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
              <ProgressCard
                title="Processing Progress"
                value={Number(totalProcessed)}
                total={Number(totalProcessed) + Number(totalInventory)}
                description="Total waste processed vs inventory"
                color="bg-blue-500"
              />
              <ProgressCard
                title="Marketplace Activity"
                value={Number(stats.activeListings)}
                total={Number(stats.activeListings) + 10} // Example max value
                description="Active marketplace listings"
                color="bg-green-500"
              />
            </div>

            {/* Waste Type Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold">Waste Type Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">Current inventory by waste type</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                {Object.values(AfricycleWasteStream)
                  .filter(value => typeof value === 'number')
                  .map((wasteType) => (
                    <div key={wasteType} className="rounded-lg border p-4">
                      <div className="flex items-center gap-2">
                        <IconRecycle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {wasteType === AfricycleWasteStream.PLASTIC ? "Plastic" :
                           wasteType === AfricycleWasteStream.EWASTE ? "E-Waste" :
                           wasteType === AfricycleWasteStream.METAL ? "Metal" : "General"}
                        </span>
                      </div>
                      <p className="mt-2 text-2xl font-bold">
                        {stats.inventoryByType[Number(wasteType)].toString()} kg
                      </p>
                      <Progress 
                        value={Number(stats.inventoryByType[Number(wasteType)]) / Number(totalInventory) * 100} 
                        className="mt-2 h-2" 
                      />
                    </div>
                  ))}
              </div>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 xl:grid-cols-3">
              <Button className="h-auto p-6" variant="outline">
                <div className="flex items-center gap-4">
                  <IconTruck className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium">Manage Pickups</p>
                    <p className="text-sm text-muted-foreground">View and manage scheduled pickups</p>
                  </div>
                </div>
              </Button>
              <Button className="h-auto p-6" variant="outline">
                <div className="flex items-center gap-4">
                  <IconRecycle className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium">Process Waste</p>
                    <p className="text-sm text-muted-foreground">Create new processing batches</p>
                  </div>
                </div>
              </Button>
              <Button className="h-auto p-6" variant="outline">
                <div className="flex items-center gap-4">
                  <IconShoppingCart className="h-6 w-6" />
                  <div className="text-left">
                    <p className="font-medium">Marketplace</p>
                    <p className="text-sm text-muted-foreground">Manage your listings</p>
                  </div>
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
} 
 