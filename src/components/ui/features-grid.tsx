import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "./card"

const FeaturesGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("grid gap-6 md:grid-cols-2 lg:grid-cols-3", className)}
    {...props}
  >
    {children}
  </div>
))
FeaturesGrid.displayName = "FeaturesGrid"

interface FeatureProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title: string
  description: string
}

const Feature = React.forwardRef<HTMLDivElement, FeatureProps>(
  ({ className, icon, title, description, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn("border-0 shadow-none text-center", className)}
      {...props}
    >
      <CardHeader className="pb-2">
        {icon && (
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
)
Feature.displayName = "Feature"

export { FeaturesGrid, Feature }