import * as React from "react"
import { cn } from "@/lib/utils"

const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("space-y-4 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32", className)}
    {...props}
  >
    {children}
  </div>
))
PageHeader.displayName = "PageHeader"

const PageHeaderHeading = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "font-heading text-3xl leading-tight tracking-tighter md:text-4xl lg:leading-[1.1]",
      className
    )}
    {...props}
  >
    {children}
  </h1>
))
PageHeaderHeading.displayName = "PageHeaderHeading"

const PageHeaderDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("max-w-2xl text-lg font-light text-foreground", className)}
    {...props}
  >
    {children}
  </p>
))
PageHeaderDescription.displayName = "PageHeaderDescription"

export { PageHeader, PageHeaderHeading, PageHeaderDescription }