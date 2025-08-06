import * as React from "react"
import { cn } from "@/lib/utils"

const Layout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-h-screen bg-background text-foreground", className)}
    {...props}
  >
    {children}
  </div>
))
Layout.displayName = "Layout"

const LayoutHeader = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}
    {...props}
  />
))
LayoutHeader.displayName = "LayoutHeader"

const LayoutMain = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn("flex-1", className)}
    {...props}
  />
))
LayoutMain.displayName = "LayoutMain"

const LayoutFooter = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
  <footer
    ref={ref}
    className={cn("border-t bg-background", className)}
    {...props}
  />
))
LayoutFooter.displayName = "LayoutFooter"

const LayoutContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("container mx-auto px-4", className)}
    {...props}
  />
))
LayoutContainer.displayName = "LayoutContainer"

export { Layout, LayoutHeader, LayoutMain, LayoutFooter, LayoutContainer }