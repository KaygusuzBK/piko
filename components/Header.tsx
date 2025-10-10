'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { searchUsers } from '@/lib/users'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, Bell } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import Image from 'next/image'
import { User as DbUser } from '@/lib/users'

export function Header() {
  const { signOut } = useAuth()
  const { user } = useAuthStore()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DbUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchResults([])
      return
    }

    setSearchLoading(true)
    try {
      const results = await searchUsers(trimmed, 20)
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  const handleUserSelect = (userId: string) => {
    setSearchQuery('')
    router.push(`/users/${userId}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-800 dark:border-gray-700 transition-colors bg-white dark:bg-black supports-[backdrop-filter]:bg-white/95 dark:supports-[backdrop-filter]:bg-black/95">
      <div className="w-full flex h-16 sm:h-16 items-center justify-between px-4 sm:px-6">
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

        {/* Search Bar - Mobile: direct input, Desktop: button */}
        <div className="flex-1 max-w-md mx-2 md:mx-4">
          {/* Mobile: Direct search input with results */}
          <div className="md:hidden relative">
            <input
              type="text"
              placeholder="Ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            
            {/* Mobile search results dropdown */}
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Arama yapılıyor...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                    Kullanıcı bulunamadı.
                  </div>
                ) : (
                  <div className="p-2">
                    {searchResults.map((dbUser) => (
                      <div
                        key={dbUser.id}
                        onClick={() => handleUserSelect(dbUser.id)}
                        className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {dbUser.name?.charAt(0) || dbUser.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">
                            {dbUser.name || 'İsim belirtilmemiş'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{dbUser.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
        {/* Desktop: Direct search input with results */}
          <div className="hidden md:block relative">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />

            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto">
                {searchLoading ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">Arama yapılıyor...</div>
                ) : searchResults.length === 0 ? (
                  <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">Kullanıcı bulunamadı.</div>
                ) : (
                  <div className="p-2">
                    {searchResults.map((dbUser) => (
                      <div
                        key={dbUser.id}
                        onClick={() => handleUserSelect(dbUser.id)}
                        className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {dbUser.name?.charAt(0) || dbUser.email?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{dbUser.name || 'İsim belirtilmemiş'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{dbUser.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Theme Toggle, Notifications & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications - Hidden on mobile */}
          <Button variant="ghost" size="icon" className="hidden sm:flex h-10 w-10 transition-all duration-200 hover:scale-110">
            <Bell className="h-5 w-5 transition-transform duration-200 hover:rotate-12" />
            <span className="sr-only">Bildirimler</span>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={user?.user_metadata?.avatar_url} 
                    alt={user?.user_metadata?.full_name || user?.email || 'Kullanıcı'} 
                  />
                  <AvatarFallback>
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || 'Kullanıcı'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => user && router.push(`/users/${user.id}`)}>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Ayarlar</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Çıkış Yap</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Popup kaldırıldı */}
    </header>
  )
}
