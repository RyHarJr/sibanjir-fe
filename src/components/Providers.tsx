"use client";

import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "./ui/ConfirmProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfirmProvider>
      {children}
      <Toaster 
        position="bottom-center" 
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{ 
          className: 'bg-surface text-on-surface border border-outline-variant shadow-lg',
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: 'var(--color-surface)',
            color: 'var(--color-on-surface)',
          }
        }} 
      />
    </ConfirmProvider>
  );
}
