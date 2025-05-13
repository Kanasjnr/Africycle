import type { Metadata } from 'next';
import { AppProvider } from "@/providers/AppProvider";
import { RoleProvider } from '@/providers/RoleProvider';
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard | AfriCycle",
  description: "AfriCycle Dashboard - Manage your waste processing operations",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleProvider>
      <AppProvider>
        <DashboardContent>
          {children}
        </DashboardContent>
      </AppProvider>
    </RoleProvider>
  );
} 