"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"
import type { ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-zinc-950/90 group-[.toaster]:text-zinc-200 group-[.toaster]:shadow-lg rounded-none text-lg py-4 px-6",
          description: "group-[.toast]:text-zinc-400 text-base",
          actionButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-200",
          cancelButton: "group-[.toast]:bg-zinc-800 group-[.toast]:text-zinc-200",
          closeButton: "group-[.toast]:hover:bg-zinc-800 group-[.toast]:text-zinc-400",
          success: "group-[.toaster]:text-green-400",
          error: "group-[.toaster]:text-red-400",
          info: "group-[.toaster]:text-zinc-400",
          warning: "group-[.toaster]:text-yellow-400",
        },
      }}
      style={{
        "--normal-bg": "rgb(9, 9, 11, 0.9)",
        "--normal-border": "transparent",
        "--normal-text": "rgb(244, 244, 245)",
        "--success-bg": "rgb(9, 9, 11, 0.9)",
        "--success-border": "transparent",
        "--success-text": "rgb(74, 222, 128)",
        "--error-bg": "rgb(9, 9, 11, 0.9)",
        "--error-border": "transparent",
        "--error-text": "rgb(248, 113, 113)",
      } as React.CSSProperties}
      {...props}
    />
  )
}

export { Toaster }
