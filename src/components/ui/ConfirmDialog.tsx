import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { Fragment } from 'react'

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Konfirmasi Aksi", 
  description = "Apakah Anda yakin ingin melanjutkan?", 
  confirmText = "Ya", 
  cancelText = "Batal", 
  isDanger = true 
}: ConfirmDialogProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[9999]" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-surface p-6 text-left align-middle shadow-2xl transition-all border border-outline-variant">
                <DialogTitle as="h3" className="text-h3 font-bold leading-6 text-on-surface mb-2">
                  {title}
                </DialogTitle>
                <p className="text-body-sm text-on-surface-variant">
                  {description}
                </p>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-surface text-on-surface border border-outline border-outline-variant hover:bg-surface-container transition-colors rounded-lg font-bold text-sm"
                    onClick={onClose}
                  >
                    {cancelText}
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                      isDanger 
                        ? 'bg-error text-on-error hover:bg-error/90' 
                        : 'bg-primary text-on-primary hover:bg-primary/90'
                    }`}
                    onClick={() => {
                      onConfirm();
                    }}
                  >
                    {confirmText}
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
