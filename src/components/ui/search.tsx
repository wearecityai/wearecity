import * as React from "react"
import { Search as SearchIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Input } from "./input"

interface SearchProps extends React.HTMLAttributes<HTMLDivElement> {
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  onSearch?: () => void
  searchLabel?: string
}

const Search = React.forwardRef<HTMLDivElement, SearchProps>(
  ({ className, placeholder, value, onValueChange, onSearch, searchLabel = "Search", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full max-w-sm items-center space-x-2", className)}
        {...props}
      >
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
          className="flex-1"
        />
        <Button className="rounded-full" type="button" onClick={onSearch} size="icon">
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">{searchLabel}</span>
        </Button>
      </div>
    )
  }
)
Search.displayName = "Search"

export { Search }