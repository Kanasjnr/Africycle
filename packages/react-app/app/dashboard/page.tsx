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
          router.push("/dashboard/collector")
          break
        case "recycler":
          router.push("/dashboard/recycler")
          break
        default:
          router.push("/")
      }
    }
  }, [role, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return null
} 