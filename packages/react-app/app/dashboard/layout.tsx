import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import { AppProvider } from "@/providers/AppProvider";
import { RoleProvider } from '@/providers/RoleProvider';
import { DashboardContent } from "@/components/dashboard/dashboard-content";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <RoleProvider>
          <AppProvider>
            <DashboardContent>
              {children}
            </DashboardContent>
          </AppProvider>
        </RoleProvider>
      </body>
    </html>
  );
} 