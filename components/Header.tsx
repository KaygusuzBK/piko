'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ThemeToggle } from './theme-toggle'
import { SearchBar } from './header/SearchBar'
import { NotificationButton } from './header/NotificationButton'
import { UserMenu } from './header/UserMenu'

export function Header() {
  const { signOut } = useAuth()
  const { user } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-50 w-full transition-colors bg-transparent">
      <div className="w-full flex h-16 sm:h-16 items-center justify-evenly px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center space-x-3 sm:space-x-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-60 blur-sm"></div>
            <Image
              src="/piko_logo.png"
              alt="Piko Logo"
              width={32}
              height={32}
              className="relative rounded-lg sm:w-8 sm:h-8 z-10"
            />
          </div>
          <h1 className="text-xl sm:text-xl font-bold text-gray-900 dark:text-white">Piko</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-2 md:mx-4">
          <SearchBar isMobile={true} />
          <SearchBar isMobile={false} />
        </div>

        {/* Right Side - Theme Toggle, Notifications & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <ThemeToggle />
          <NotificationButton />
          <UserMenu user={user} onSignOut={handleSignOut} />
        </div>
      </div>
    </header>
  )
}

