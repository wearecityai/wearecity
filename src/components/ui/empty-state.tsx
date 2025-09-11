import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  }
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col items-center justify-center space-y-4 p-8 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="text-muted-foreground">{icon}</div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold whitespace-pre-line">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action && (
        <Button
          variant={action.variant || "default"}
          onClick={action.onClick}
          className="rounded-full"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
)
EmptyState.displayName = "EmptyState"

export { EmptyState }