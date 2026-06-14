"use client"

import { Toaster } from "react-hot-toast"
import { ConfirmProvider } from "./ui/ConfirmProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      {children}
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          className: "bg-surface text-on-surface border border-outline-variant shadow-lg",
          duration: 3000,
          style: {
            borderRadius: "12px",
            background: "#faf8ff",
            color: "#1a1b21",
          },
        }}
      />
    </ConfirmProvider>
  )
}
