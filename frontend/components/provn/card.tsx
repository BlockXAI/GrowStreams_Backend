import { cn } from "@/lib/utils"
import { type HTMLAttributes, forwardRef } from "react"

const ProvnCard = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-provn-surface border border-provn-border rounded-xl overflow-hidden transition-all duration-[120ms] ease-out hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
      className,
    )}
    {...props}
  />
))
ProvnCard.displayName = "ProvnCard"

const ProvnCardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pb-0", className)} {...props} />
))
ProvnCardHeader.displayName = "ProvnCardHeader"

const ProvnCardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6", className)} {...props} />
))
ProvnCardContent.displayName = "ProvnCardContent"

export { ProvnCard, ProvnCardHeader, ProvnCardContent }
