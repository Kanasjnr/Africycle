import { cn } from "@/lib/utils"

interface LoaderProps {
  message?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export function Loader({ message, className, size = "md" }: LoaderProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center p-6", className)}>
      <div className={cn(
        "animate-spin rounded-full border-4 border-muted",
        "border-t-primary",
        sizeClasses[size]
      )} />
      {message && (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          {message}
        </p>
      )}
    </div>
  )
} 