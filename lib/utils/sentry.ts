/**
 * Sentry Error Monitoring Utilities
 * 
 * Provides utilities for error tracking, performance monitoring, and user context.
 */

import * as Sentry from '@sentry/nextjs'
import { SentryErrorFallback } from '@/components/error/SentryErrorFallback'

export class SentryService {
  /**
   * Set user context for error tracking
   */
  static setUserContext(user: {
    id: string
    email?: string
    username?: string
    name?: string
  }) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    })
  }

  /**
   * Clear user context
   */
  static clearUserContext() {
    Sentry.setUser(null)
  }

  /**
   * Set custom tags for error tracking
   */
  static setTags(tags: Record<string, string>) {
    Sentry.setTags(tags)
  }

  /**
   * Set custom context for error tracking
   */
  static setContext(key: string, context: Record<string, unknown>) {
    Sentry.setContext(key, context)
  }

  /**
   * Capture an exception
   */
  static captureException(error: Error, context?: Record<string, unknown>) {
    if (context) {
      Sentry.withScope((scope) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setContext(key, value as any)
        })
        Sentry.captureException(error)
      })
    } else {
      Sentry.captureException(error)
    }
  }

  /**
   * Capture a message
   */
  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level)
  }

  /**
   * Start a transaction for performance monitoring
   */
  static startTransaction(name: string, op: string = 'custom') {
    return Sentry.startSpan({ name, op }, () => {})
  }

  /**
   * Add breadcrumb for debugging
   */
  static addBreadcrumb(message: string, category: string = 'custom', level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    })
  }

  /**
   * Track API call performance
   */
  static async trackApiCall<T>(
    apiName: string,
    apiCall: () => Promise<T>,
    context?: Record<string, unknown>
  ): Promise<T> {
    return Sentry.startSpan({ name: `API: ${apiName}`, op: 'http.client' }, async (span) => {
      try {
        const result = await apiCall()
        span?.setStatus({ code: 1, message: 'ok' })
        return result
      } catch (error) {
        span?.setStatus({ code: 2, message: 'internal_error' })
        this.captureException(error as Error, {
          apiName,
          ...context
        })
        throw error
      }
    })
  }

  /**
   * Track user action
   */
  static trackUserAction(action: string, context?: Record<string, unknown>) {
    this.addBreadcrumb(`User action: ${action}`, 'user-action', 'info')
    
    if (context) {
      this.setContext('userAction', context)
    }
  }

  /**
   * Track page view
   */
  static trackPageView(page: string, context?: Record<string, unknown>) {
    this.addBreadcrumb(`Page view: ${page}`, 'navigation', 'info')
    
    if (context) {
      this.setContext('pageView', context)
    }
  }

  /**
   * Track authentication events
   */
  static trackAuthEvent(event: 'login' | 'logout' | 'signup' | 'password_reset', context?: Record<string, unknown>) {
    this.addBreadcrumb(`Auth event: ${event}`, 'auth', 'info')
    
    if (context) {
      this.setContext('authEvent', context)
    }
  }

  /**
   * Track post interactions
   */
  static trackPostInteraction(
    action: 'create' | 'like' | 'comment' | 'retweet' | 'share' | 'delete' | 'unlike' | 'unretweet' | 'bookmark' | 'unbookmark',
    postId: string,
    context?: Record<string, unknown>
  ) {
    this.addBreadcrumb(`Post ${action}: ${postId}`, 'post-interaction', 'info')
    
    this.setContext('postInteraction', {
      action,
      postId,
      ...context
    })
  }

  /**
   * Track search queries
   */
  static trackSearch(query: string, resultsCount: number, context?: Record<string, unknown>) {
    this.addBreadcrumb(`Search: ${query} (${resultsCount} results)`, 'search', 'info')
    
    this.setContext('search', {
      query,
      resultsCount,
      ...context
    })
  }

  /**
   * Track performance metrics
   */
  static trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.addBreadcrumb(`Performance: ${metric} = ${value}${unit}`, 'performance', 'info')
    
    this.setContext('performance', {
      metric,
      value,
      unit
    })
  }

  /**
   * Track error with user context
   */
  static trackError(error: Error, userContext?: Record<string, unknown>, additionalContext?: Record<string, unknown>) {
    Sentry.withScope((scope) => {
      if (userContext) {
        scope.setUser(userContext)
      }
      
      if (additionalContext) {
        Object.entries(additionalContext).forEach(([key, value]) => {
          scope.setContext(key, value as any)
        })
      }
      
      Sentry.captureException(error)
    })
  }

  /**
   * Track feature usage
   */
  static trackFeatureUsage(feature: string, context?: Record<string, unknown>) {
    this.addBreadcrumb(`Feature used: ${feature}`, 'feature-usage', 'info')
    
    if (context) {
      this.setContext('featureUsage', {
        feature,
        ...context
      })
    }
  }

  /**
   * Track conversion events
   */
  static trackConversion(event: string, value?: number, context?: Record<string, unknown>) {
    this.addBreadcrumb(`Conversion: ${event}`, 'conversion', 'info')
    
    this.setContext('conversion', {
      event,
      value,
      ...context
    })
  }
}

// React Hook for Sentry integration
export function useSentry() {
  return {
    setUser: SentryService.setUserContext,
    clearUser: SentryService.clearUserContext,
    trackAction: SentryService.trackUserAction,
    trackPageView: SentryService.trackPageView,
    trackError: SentryService.trackError,
    trackFeature: SentryService.trackFeatureUsage,
    trackConversion: SentryService.trackConversion,
    captureException: SentryService.captureException,
    captureMessage: SentryService.captureMessage,
  }
}

// Error boundary component
export function withSentryErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return Sentry.withErrorBoundary(Component, {
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('errorBoundary', true)
      scope.setContext('errorInfo', errorInfo as any)
    }
  })
}
