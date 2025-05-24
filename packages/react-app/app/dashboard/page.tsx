"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/hooks/use-role"
import { GoodDollarClaim } from '../../components/GoodDollarClaim'

export default function DashboardPage() {
  const router = useRouter()
  const { role, isLoading } = useRole()

  useEffect(() => {
    if (!isLoading) {
      switch (role) {
        case "collector":
          router.push("/dashboard/collector")
          break
        case "corporate_partner":
          router.push("/dashboard/corporate-partner")
          break
        case "collection_point":
          router.push("/dashboard/collection-point")
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-8">
        <GoodDollarClaim />
      </div>

      {/* ... existing dashboard content ... */}
    </div>
  )
} 