import { cn } from "@/lib/utils"
import { type HTMLAttributes, forwardRef } from "react"

interface ProvnBadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "verified" | "success" | "warning" | "error"
}

const ProvnBadge = forwardRef<HTMLDivElement, ProvnBadgeProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-2xl px-2.5 py-1 text-xs leading-none",
        {
          "bg-provn-surface-2 text-provn-muted": variant === "default",
          "bg-provn-surface-2 text-provn-muted before:block before:w-2 before:h-2 before:rounded-full before:bg-provn-accent":
            variant === "verified",
          "bg-provn-success/20 text-provn-success": variant === "success",
          "bg-provn-warning/20 text-provn-warning": variant === "warning",
          "bg-provn-error/20 text-provn-error": variant === "error",
        },
        className,
      )}
      {...props}
    />
  )
})
ProvnBadge.displayName = "ProvnBadge"

export { ProvnBadge, ProvnBadge as Badge }
