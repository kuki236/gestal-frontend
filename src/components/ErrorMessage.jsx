'use client';

import React from 'react';
import { AlertCircle, X, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function ErrorMessage({
  title = 'No se pudo completar la operación',
  message,
  onDismiss = null,
  onRetry = null,
}) {
  if (!message) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </div>
        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="h-8 border-red-200 bg-white text-red-700 hover:bg-red-50 shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reintentar</span>
          </Button>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 text-red-700/70 transition-colors hover:bg-red-100 hover:text-red-900"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
}

export default ErrorMessage;
