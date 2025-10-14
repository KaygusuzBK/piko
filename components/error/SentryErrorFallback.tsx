'use client'

import React from 'react'

interface SentryErrorFallbackProps {
  error: Error
  resetError: () => void
}

export function SentryErrorFallback({ error, resetError }: SentryErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Bir hata oluştu</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={resetError}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Tekrar Dene
      </button>
    </div>
  )
}
