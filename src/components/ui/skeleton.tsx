import { cn } from "@/lib/utils"
import { omitLovProps } from '../../lib/omitLovProps';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...omitLovProps(props)}
    />
  )
}

export { Skeleton }
