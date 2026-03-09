"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      toastOptions={{
        style: {
          background: "var(--card)",
          border: "2px solid var(--primary)",
          color: "var(--foreground)",
          fontFamily: "var(--font-press-start)",
        },
        classNames: {
          error: "!border-red-500",
          success: "!border-green-500",
          warning: "!border-yellow-500",
          info: "!border-primary",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
