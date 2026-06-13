"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import ConfirmDialog, { ConfirmDialogProps } from "./ConfirmDialog";

type ConfirmOptions = Omit<ConfirmDialogProps, "isOpen" | "onClose" | "onConfirm">;

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const [resolveFn, setResolveFn] = useState<((value: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOpts(options);
      setResolveFn(() => resolve);
      setIsOpen(true);
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(false);
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(true);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmDialog 
        isOpen={isOpen} 
        onClose={handleClose} 
        onConfirm={handleConfirm} 
        {...opts} 
      />
    </ConfirmContext.Provider>
  );
}

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
};
