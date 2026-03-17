import { cn } from "@/lib/utils"
import { type ButtonHTMLAttributes, forwardRef } from "react"

interface ProvnButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary"
  size?: "sm" | "md" | "lg"
}

const ProvnButton = forwardRef<HTMLButtonElement, ProvnButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-[10px] font-headline font-semibold transition-all duration-[120ms] ease-out disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-provn-bg",
          // Variants with better contrast
          {
            "bg-provn-accent text-provn-bg hover:bg-provn-accent-press focus:ring-provn-accent active:scale-95":
              variant === "primary",
            "bg-transparent text-provn-text border border-provn-border hover:bg-provn-surface-2 focus:ring-provn-accent active:scale-95":
              variant === "secondary",
          },
          // Sizes
          {
            "px-3 py-2 text-sm": size === "sm",
            "px-[14px] py-[10px] text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  },
)
ProvnButton.displayName = "ProvnButton"

export { ProvnButton, ProvnButton as Button }
