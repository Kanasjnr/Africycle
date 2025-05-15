import type { Metadata } from 'next';
import { AppProvider } from "@/providers/AppProvider";
import { RoleProvider } from '@/providers/RoleProvider';

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
        {children}
      </AppProvider>
    </RoleProvider>
  );
} 