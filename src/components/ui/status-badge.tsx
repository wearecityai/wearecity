import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "border-transparent bg-green-500/10 text-green-600 dark:text-green-400",
        error: "border-transparent bg-red-500/10 text-red-600 dark:text-red-400",
        warning: "border-transparent bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
        info: "border-transparent bg-blue-500/10 text-blue-600 dark:text-blue-400",
        pending: "border-transparent bg-orange-500/10 text-orange-600 dark:text-orange-400",
        neutral: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  status?: 'online' | 'offline' | 'loading' | 'error' | 'success'
}

function StatusBadge({ className, variant, status, children, ...props }: StatusBadgeProps) {
  // Auto-map status to variant if provided
  const resolvedVariant = status 
    ? (status === 'online' || status === 'success') ? 'success'
      : status === 'offline' ? 'neutral'
      : status === 'loading' ? 'pending'
      : status === 'error' ? 'error'
      : variant
    : variant

  return (
    <div className={cn(statusBadgeVariants({ variant: resolvedVariant }), className)} {...props}>
      {status && (
        <span 
          className={cn(
            "mr-1.5 h-2 w-2 rounded-full",
            status === 'online' || status === 'success' ? "bg-green-500" :
            status === 'offline' ? "bg-gray-400" :
            status === 'loading' ? "bg-orange-500 animate-pulse" :
            status === 'error' ? "bg-red-500" : ""
          )} 
        />
      )}
      {children}
    </div>
  )
}

export { StatusBadge, statusBadgeVariants }