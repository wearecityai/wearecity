import * as React from "react"
import { cn } from "@/lib/utils"

const Hero = React.forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement>
>(({ className, children, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("relative py-20 md:py-32 overflow-hidden", className)}
    {...props}
  >
    {children}
  </section>
))
Hero.displayName = "Hero"

const HeroContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("container relative z-10 text-center space-y-8", className)}
    {...props}
  >
    {children}
  </div>
))
HeroContent.displayName = "HeroContent"

const HeroTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn(
      "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h1>
))
HeroTitle.displayName = "HeroTitle"

const HeroSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "mx-auto max-w-[700px] text-lg text-muted-foreground sm:text-xl",
      className
    )}
    {...props}
  >
    {children}
  </p>
))
HeroSubtitle.displayName = "HeroSubtitle"

const HeroActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col gap-4 sm:flex-row sm:justify-center", className)}
    {...props}
  >
    {children}
  </div>
))
HeroActions.displayName = "HeroActions"

export { Hero, HeroContent, HeroTitle, HeroSubtitle, HeroActions }