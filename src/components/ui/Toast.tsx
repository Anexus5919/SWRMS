'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  show: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const ICONS: Record<ToastType, ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'bg-status-green-light', border: 'border-status-green/30', text: 'text-status-green-dark', icon: 'text-status-green' },
  error:   { bg: 'bg-status-red-light',   border: 'border-status-red/30',   text: 'text-status-red-dark',   icon: 'text-status-red' },
  warning: { bg: 'bg-status-amber-light', border: 'border-status-amber/30', text: 'text-status-amber-dark', icon: 'text-status-amber' },
  info:    { bg: 'bg-status-blue-light',  border: 'border-status-blue/30',  text: 'text-bmc-900',           icon: 'text-status-blue' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => remove(id), 5000);
  }, [remove]);

  const value: ToastContextValue = {
    show,
    success: (title, description) => show({ type: 'success', title, description }),
    error:   (title, description) => show({ type: 'error', title, description }),
    warning: (title, description) => show({ type: 'warning', title, description }),
    info:    (title, description) => show({ type: 'info', title, description }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container - bottom-right on desktop, bottom-center on mobile */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 z-[100] flex flex-col gap-2 sm:max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const styles = STYLES[toast.type];
          return (
            <div
              key={toast.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 ${styles.bg} ${styles.border} border ${styles.text} rounded-lg p-4 shadow-doc-lg animate-fade-in`}
            >
              <span className={styles.icon}>{ICONS[toast.type]}</span>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold leading-tight">{toast.title}</p>
                {toast.description && (
                  <p className="text-xs mt-1 opacity-90 leading-relaxed">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(toast.id)}
                className="opacity-60 hover:opacity-100 flex-shrink-0"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
