'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoginForm } from '@/components/login-form'

export default function LoginPage() {
  const { signInWithGitHub, signInWithGoogle } = useAuth()
  const { user, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="text-lg text-foreground">Yükleniyor...</div>
      </div>
    )
  }

  if (user) {
    return null // Redirect will happen
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          onGitHubLogin={signInWithGitHub}
          onGoogleLogin={signInWithGoogle}
        />
      </div>
    </div>
  )
}
