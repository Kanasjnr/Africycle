import React from "react"

export interface DashboardHeaderProps {
  heading: string
  text?: string
  showClaimButton?: boolean
}

export function DashboardHeader({ heading, text }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold tracking-tight">{heading}</h2>
        {text && <p className="text-muted-foreground">{text}</p>}
      </div>
    </div>
  )
} 