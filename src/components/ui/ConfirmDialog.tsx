'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  icon?: ReactNode;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

let resolver: ((value: boolean) => void) | null = null;

import { createContext, useContext } from 'react';

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>');
  return ctx.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver = resolve;
    });
  }, []);

  const handleConfirm = () => {
    resolver?.(true);
    setOpen(false);
  };

  const handleCancel = () => {
    resolver?.(false);
    setOpen(false);
  };

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleCancel();
      if (e.key === 'Enter') handleConfirm();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isDestructive = options?.variant === 'destructive';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {open && options && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-bmc-950/60 backdrop-blur-sm"
            onClick={handleCancel}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-doc-xl border border-[var(--border)] max-w-md w-full overflow-hidden">
            {/* Top accent strip */}
            <div className={`h-1 ${isDestructive ? 'bg-status-red' : 'bg-bmc-700'}`} />

            <div className="p-6">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
                    isDestructive ? 'bg-status-red-light text-status-red' : 'bg-bmc-100 text-bmc-700'
                  }`}
                >
                  {options.icon ?? (
                    isDestructive ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    )
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 id="confirm-title" className="font-display text-base font-bold text-[var(--neutral-900)]">
                    {options.title}
                  </h3>
                  {options.description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                      {options.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-[var(--surface-sunken)] border-t border-[var(--border)]">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-white rounded-md transition-colors"
              >
                {options.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-md transition-colors shadow-doc ${
                  isDestructive
                    ? 'bg-status-red hover:bg-status-red-dark'
                    : 'bg-bmc-700 hover:bg-bmc-800'
                }`}
                autoFocus
              >
                {options.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
