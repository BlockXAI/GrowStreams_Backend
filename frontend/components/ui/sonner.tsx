"use client"

import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--provn-surface)",
          "--normal-text": "var(--provn-text)",
          "--normal-border": "var(--provn-border)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
