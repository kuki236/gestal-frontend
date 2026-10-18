'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 4000 }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-[360px] flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.variant === 'success';
          const isError = t.variant === 'destructive';
          const Icon = isSuccess
            ? CheckCircle2
            : isError
            ? AlertCircle
            : Info;

          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all animate-in slide-in-from-bottom-4 fade-in-0',
                isSuccess
                  ? 'border-[#B7DEC9] bg-[#E6F2EC] text-[#1E6B47]'
                  : isError
                  ? 'border-[#E9B8B8] bg-[#F7E6E6] text-[#A61C1C]'
                  : 'border-[#D8D5CE] bg-white text-[#1C242B]'
              )}
            >
              <Icon className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                {t.title && (
                  <div className="text-xs font-extrabold leading-tight">
                    {t.title}
                  </div>
                )}
                {t.description && (
                  <div className="mt-1 text-xs opacity-90 leading-snug">
                    {t.description}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="rounded-md p-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                aria-label="Cerrar notificación"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      toast: () => {},
      dismiss: () => {},
    };
  }
  return ctx;
}
