"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useRole } from "@/hooks/use-role"
import { RegistrationDialog } from "@/components/dialogs/registration-dialog"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount } from "wagmi"

export default function HomePage() {
  const router = useRouter()
  const { role, isLoading } = useRole()
  const { isConnected } = useAccount()

  useEffect(() => {
    if (!isLoading && role) {
      router.push("/dashboard")
    }
  }, [role, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Africycle</h1>
        <p className="text-xl text-center mb-8">
          {!isConnected 
            ? "Connect your wallet to get started"
            : role 
              ? "Redirecting to dashboard..."
              : "Complete your registration to continue"
          }
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </div>
      {isConnected && !role && <RegistrationDialog />}
    </main>
  )
}

