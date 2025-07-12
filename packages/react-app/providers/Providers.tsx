"use client"

import { RoleProvider } from './RoleProvider'
import { AppProvider } from './AppProvider'
import { Toaster } from 'sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <RoleProvider>
          {children}
          <Toaster richColors position="top-right" />
      </RoleProvider>
    </AppProvider>
  )
} 