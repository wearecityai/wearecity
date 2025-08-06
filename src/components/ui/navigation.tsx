import * as React from "react"
import { cn } from "@/lib/utils"

const Navigation = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <nav
    ref={ref}
    className={cn("flex items-center space-x-6 text-sm font-medium", className)}
    {...props}
  >
    {children}
  </nav>
))
Navigation.displayName = "Navigation"

const NavigationItem = React.forwardRef<
  HTMLAnchorElement,
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    active?: boolean
  }
>(({ className, active, children, ...props }, ref) => (
  <a
    ref={ref}
    className={cn(
      "transition-colors hover:text-foreground/80",
      active ? "text-foreground" : "text-foreground/60",
      className
    )}
    {...props}
  >
    {children}
  </a>
))
NavigationItem.displayName = "NavigationItem"

export { Navigation, NavigationItem }