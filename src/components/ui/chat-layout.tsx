import * as React from "react"
import { cn } from "@/lib/utils"

const ChatLayout = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex h-screen w-full overflow-hidden", className)}
    {...props}
  >
    {children}
  </div>
))
ChatLayout.displayName = "ChatLayout"

const ChatSidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    collapsed?: boolean
  }
>(({ className, collapsed = false, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-muted/50 transition-all duration-300 ease-in-out",
      collapsed ? "w-16" : "w-80",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
ChatSidebar.displayName = "ChatSidebar"

const ChatMain = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col overflow-hidden", className)}
    {...props}
  >
    {children}
  </div>
))
ChatMain.displayName = "ChatMain"

const ChatHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between border-b bg-background p-4",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
ChatHeader.displayName = "ChatHeader"

const ChatMessages = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 overflow-y-auto overflow-x-hidden", className)}
    {...props}
  >
    <div className="p-4">
      {children}
    </div>
  </div>
))
ChatMessages.displayName = "ChatMessages"

const ChatInput = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("border-t bg-background p-4", className)}
    {...props}
  >
    {children}
  </div>
))
ChatInput.displayName = "ChatInput"

export {
  ChatLayout,
  ChatSidebar,
  ChatMain,
  ChatHeader,
  ChatMessages,
  ChatInput
}