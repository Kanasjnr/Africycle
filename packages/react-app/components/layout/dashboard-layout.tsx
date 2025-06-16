'use client';

import { ReactNode } from 'react';
import { useRole } from "@/providers/RoleProvider"
import { BottomNav, recyclerNavItems, collectorNavItems } from "@/components/dashboard/bottom-nav"
import { DashboardShell } from "@/components/dashboard/shell"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role } = useRole();
  const pathname = usePathname();

  // Determine which nav items to show based on role
  const navItems = role === 'recycler' ? recyclerNavItems : collectorNavItems;

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardShell>
        {children}
      </DashboardShell>
      
      {/* Bottom navigation for mobile */}
      <BottomNav items={navItems} />
    </div>
  );
} 