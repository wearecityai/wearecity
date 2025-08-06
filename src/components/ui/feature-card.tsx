import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description?: string
  children?: React.ReactNode
  hover?: boolean
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon, title, description, children, hover = true, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        "text-center border-primary/20",
        hover && "hover:shadow-lg transition-shadow duration-200",
        className
      )}
      {...props}
    >
      <CardContent className="p-8">
        {icon && (
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            {icon}
          </div>
        )}
        <CardHeader className="p-0 space-y-3">
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && (
            <CardDescription className="leading-relaxed">
              {description}
            </CardDescription>
          )}
        </CardHeader>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  )
)
FeatureCard.displayName = "FeatureCard"

export { FeatureCard }