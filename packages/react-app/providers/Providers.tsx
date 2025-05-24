"use client"

import { RoleProvider } from './RoleProvider'
import { AppProvider } from './AppProvider'
import { GoodDollarProvider } from './GoodDollarProvider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <RoleProvider>
        <GoodDollarProvider>
          {children}
          <Toaster richColors position="top-right" />
        </GoodDollarProvider>
      </RoleProvider>
    </AppProvider>
  )
} 