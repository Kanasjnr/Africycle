'use client';

import { useState } from 'react';
import { useRole } from '@/providers/RoleProvider';
import { Button } from '@/components/ui/button';
import { Menu, X, Bell, Search, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = {
  collector: [
    { name: 'Overview', href: '/dashboard/collector' },
    { name: 'QR Scanner', href: '/dashboard/collector/scanner' },
    { name: 'Collection Map', href: '/dashboard/collector/map' },
    { name: 'Photo Verification', href: '/dashboard/collector/verification' },
    { name: 'Digital Wallet', href: '/dashboard/collector/wallet' },
  ],
  collection_point: [
    { name: 'Overview', href: '/dashboard/collection-point' },
    { name: 'Material Verification', href: '/dashboard/collection-point/verification' },
    { name: 'Inventory', href: '/dashboard/collection-point/inventory' },
    { name: 'Logistics', href: '/dashboard/collection-point/logistics' },
  ],
  recycler: [
    { name: 'Overview', href: '/dashboard/recycler' },
    { name: 'Material Tracking', href: '/dashboard/recycler/tracking' },
    { name: 'Processing', href: '/dashboard/recycler/processing' },
    { name: 'Marketplace', href: '/dashboard/recycler/marketplace' },
    { name: 'Compliance', href: '/dashboard/recycler/compliance' },
  ],
  corporate_partner: [
    { name: 'Overview', href: '/dashboard/corporate' },
    { name: 'Impact Dashboard', href: '/dashboard/corporate/impact' },
    { name: 'Credit Marketplace', href: '/dashboard/corporate/marketplace' },
    { name: 'ESG Reporting', href: '/dashboard/corporate/reporting' },
  ],
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { role } = useRole();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const pathname = usePathname();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    // Here you would typically update the theme in your app
  };

  const navigationItems = role ? navigation[role] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        <div className="fixed inset-0 z-40 flex">
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setSidebarOpen(false)}
          />
          <div
            className={`relative flex w-full max-w-xs flex-1 flex-col bg-background transition-transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex h-16 items-center justify-between px-4">
              <span className="text-xl font-bold">AfriCycle</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-background">
          <div className="flex h-16 items-center px-4">
            <span className="text-xl font-bold">AfriCycle</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-10 flex h-16 items-center gap-x-4 border-b bg-background px-4 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 gap-x-4">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-sm bg-background ring-1 ring-inset ring-input placeholder:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6"
                placeholder="Search..."
              />
            </div>

            <div className="flex items-center gap-x-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary" />
            </div>
          </div>
        </div>

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
} 