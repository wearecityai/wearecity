import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-full border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        style={{
          borderRadius: '9999px !important',
          WebkitAppearance: 'none !important',
          WebkitBorderRadius: '9999px !important',
          MozBorderRadius: '9999px !important',
          borderTopLeftRadius: '9999px !important',
          borderTopRightRadius: '9999px !important',
          borderBottomLeftRadius: '9999px !important',
          borderBottomRightRadius: '9999px !important',
          ...(type === 'password' && {
            WebkitTextSecurity: 'disc',
            textSecurity: 'disc'
          }),
          ...props.style
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
