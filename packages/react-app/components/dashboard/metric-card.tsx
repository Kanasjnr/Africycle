import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  title: string
  value: string
  trend?: {
    value: number
    label: string
    positive: boolean
  }
  icon?: React.ReactNode
}

export function MetricCard({ title, value, trend, icon }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend && (
            <span
              className={cn(
                "text-sm",
                trend.positive ? "text-green-600" : "text-red-600"
              )}
            >
              {trend.positive ? "+" : "-"}
              {trend.value}%
            </span>
          )}
        </div>
        {trend && (
          <p className="mt-1 text-xs text-muted-foreground">{trend.label}</p>
        )}
      </div>
    </Card>
  )
} 