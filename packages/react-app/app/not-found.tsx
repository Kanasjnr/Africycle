"use client"

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Handle dynamic routes that weren't pre-generated
    if (pathname?.includes('/dashboard/collector/verification/')) {
      // Extract the ID from the path
      const pathParts = pathname.split('/')
      const id = pathParts[pathParts.length - 1]
      
      // If it looks like a valid ID, redirect to the dynamic page
      if (id && !isNaN(Number(id))) {
        // Use client-side navigation to the dynamic route
        window.location.href = `/dashboard/collector/verification/[id]/?id=${id}`
        return
      }
    }
    
    // For other routes, redirect to dashboard
    router.push('/dashboard')
  }, [pathname, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
        <p className="text-gray-600">Redirecting to the correct page...</p>
      </div>
    </div>
  )
} 