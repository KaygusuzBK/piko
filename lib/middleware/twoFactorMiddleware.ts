/**
 * Two-Factor Authentication Middleware
 * 
 * Checks if user needs 2FA verification for protected routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function twoFactorMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return response
    }

    // Check if user has 2FA enabled
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.two_factor_enabled) {
      return response
    }

    // Check if user has valid 2FA session
    const sessionToken = request.cookies.get('2fa_session')?.value
    
    if (sessionToken) {
      const { data: sessionData, error: sessionError } = await supabase.rpc('verify_two_factor_session', {
        session_token: sessionToken
      })

      if (!sessionError && sessionData && sessionData.length > 0 && sessionData[0].is_valid) {
        return response
      }
    }

    // Check if current route requires 2FA verification
    const protectedRoutes = [
      '/settings',
      '/messages',
      '/analytics',
      '/admin'
    ]

    const isProtectedRoute = protectedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    if (isProtectedRoute) {
      // Redirect to 2FA verification page
      const verificationUrl = new URL('/auth/2fa-verify', request.url)
      verificationUrl.searchParams.set('redirect', request.nextUrl.pathname)
      
      return NextResponse.redirect(verificationUrl)
    }

    return response
  } catch (error) {
    console.error('2FA middleware error:', error)
    return response
  }
}
