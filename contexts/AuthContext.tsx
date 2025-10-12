'use client'

import { createContext, useContext, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/lib/services/authService'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGitHub: () => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading, setUser, setSession, setLoading } = useAuthStore()

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setSession(session as Session | null)
      setUser((session as Session | null)?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, setLoading])

  const signInWithGitHub = async () => {
    await authService.signInWithGitHub()
  }

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle()
  }

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await authService.signInWithEmail(email, password)
    if (error) return { error: error as Error }
    return { error: null }
  }

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    const { error } = await authService.signUpWithEmail(email, password, displayName)
    if (error) return { error: error as Error }
    return { error: null }
  }

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword(email)
    if (error) return { error: error as Error }
    return { error: null }
  }

  const signOut = async () => {
    await authService.signOut()
    useAuthStore.getState().signOut()
  }

  const value = {
    user,
    session,
    loading,
    signInWithGitHub,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

