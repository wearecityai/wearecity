import * as React from "react"
import { cn } from "@/lib/utils"

const DashboardLayout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-h-screen bg-background", className)}
    {...props}
  >
    {children}
  </div>
))
DashboardLayout.displayName = "DashboardLayout"

const DashboardHeader = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <header
    ref={ref}
    className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}
    {...props}
  >
    {children}
  </header>
))
DashboardHeader.displayName = "DashboardHeader"

const DashboardNav = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("flex items-center space-x-4 lg:space-x-6", className)}
    {...props}
  >
    {children}
  </nav>
))
DashboardNav.displayName = "DashboardNav"

const DashboardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 space-y-4 p-8 pt-6", className)}
    {...props}
  >
    {children}
  </div>
))
DashboardContent.displayName = "DashboardContent"

const DashboardShell = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("grid items-start gap-8", className)} {...props}>
    {children}
  </div>
))
DashboardShell.displayName = "DashboardShell"

export {
  DashboardLayout,
  DashboardHeader,
  DashboardNav,
  DashboardContent,
  DashboardShell
}