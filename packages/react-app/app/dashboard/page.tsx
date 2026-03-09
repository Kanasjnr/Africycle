"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/providers/RoleProvider"

export default function DashboardPage() {
  const router = useRouter()
  const { role, isLoading } = useRole()

  useEffect(() => {
    if (!isLoading) {
      switch (role) {
        case "collector":
          router.replace("/dashboard/collector")
          break
        case "recycler":
          router.replace("/dashboard/recycler")
          break
        default:
          router.replace("/")
      }
    }
  }, [role, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-background border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">AfriCycle Dashboard</h2>
            <p className="text-muted-foreground animate-pulse font-medium">Identifying your role and preparing your workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground font-medium">Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}