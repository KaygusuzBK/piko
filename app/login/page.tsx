'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { LoginForm } from '@/components/login-form'
import Image from 'next/image'

export default function LoginPage() {
  const { signInWithGitHub, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth()
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
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#BF092F]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#BF092F]/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex flex-col items-center justify-center space-y-8 p-8">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#BF092F] to-purple-600 opacity-60 blur-2xl animate-pulse"></div>
            <Image
              src="/soc-ai_logo.png"
              alt="Piko Logo"
              width={150}
              height={150}
              className="relative rounded-3xl z-10 drop-shadow-2xl"
            />
          </div>
          <div className="text-center space-y-4">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#BF092F] to-purple-600 bg-clip-text text-transparent">
              Piko
            </h1>
            <p className="text-2xl text-muted-foreground max-w-md">
              Düşüncelerinizi paylaşın, dünyayla bağlantı kurun
            </p>
            <div className="flex items-center justify-center space-x-8 pt-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">10K+</div>
                <div className="text-sm text-muted-foreground">Kullanıcı</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">50K+</div>
                <div className="text-sm text-muted-foreground">Gönderi</div>
              </div>
              <div className="h-12 w-px bg-border"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">100K+</div>
                <div className="text-sm text-muted-foreground">Etkileşim</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#BF092F] to-purple-600 opacity-60 blur-xl"></div>
              <Image
                src="/soc-ai_logo.png"
                alt="Piko Logo"
                width={80}
                height={80}
                className="relative rounded-2xl z-10"
              />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#BF092F] to-purple-600 bg-clip-text text-transparent">
              Piko
            </h1>
          </div>
          
          <LoginForm 
            onGitHubLogin={signInWithGitHub}
            onGoogleLogin={signInWithGoogle}
            onEmailLogin={signInWithEmail}
            onEmailSignup={signUpWithEmail}
          />
        </div>
      </div>
    </div>
  )
}
