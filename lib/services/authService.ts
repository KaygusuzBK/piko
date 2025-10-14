import { createClient } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'

export class AuthService {
  private supabase = createClient()

  async signInWithGitHub() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      console.error('GitHub login error:', error)
      throw error
    }
  }

  async signInWithGoogle() {
    const { error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) {
      console.error('Google login error:', error)
      throw error
    }
  }

  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      console.error('Email login error:', error)
      return { data: null, error: error as Error }
    }
    return { data, error: null }
  }

  async signUpWithEmail(email: string, password: string, displayName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: displayName,
          display_name: displayName,
        },
      },
    })
    if (error) {
      console.error('Email signup error:', error)
      return { data: null, error: error as Error }
    }
    return { data, error: null }
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      console.error('Password reset error:', error)
      return { error: error as Error }
    }
    return { error: null }
  }

  async getSession() {
    return await this.supabase.auth.getSession()
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }
}

// Singleton instance
export const authService = new AuthService()

