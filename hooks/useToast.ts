/**
 * useToast Hook
 * 
 * Wrapper around sonner for consistent toast notifications.
 * Provides type-safe toast methods with custom styling.
 */

import { toast as sonnerToast } from 'sonner'

export interface ToastOptions {
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const success = (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      action: options?.action
    })
  }

  const error = (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action
    })
  }

  const info = (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration || 3000,
      action: options?.action
    })
  }

  const warning = (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration || 3500,
      action: options?.action
    })
  }

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: any) => string)
    }
  ) => {
    return sonnerToast.promise(promise, messages)
  }

  const custom = (component: (id: string | number) => React.ReactElement, options?: ToastOptions) => {
    return sonnerToast.custom(component, {
      duration: options?.duration || 3000
    })
  }

  const dismiss = (toastId?: string | number) => {
    sonnerToast.dismiss(toastId)
  }

  return {
    success,
    error,
    info,
    warning,
    promise,
    custom,
    dismiss
  }
}

