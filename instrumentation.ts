export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Request error instrumentation
export const onRequestError = (error: Error, request: Request) => {
  // Import Sentry dynamically to avoid issues
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.captureRequestError(error, request)
  })
}
