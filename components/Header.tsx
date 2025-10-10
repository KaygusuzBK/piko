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
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandList,
} from '@/components/ui/command'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Search, User, LogOut, Settings, Bell } from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import Image from 'next/image'
import { User as DbUser } from '@/lib/users'

export function Header() {
  const { signOut } = useAuth()
  const { user } = useAuthStore()
  const router = useRouter()
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DbUser[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const handleSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!searchOpen || !trimmed) {
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
  }, [searchOpen])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, searchOpen, handleSearch])

  const handleUserSelect = (userId: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/users/${userId}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border transition-colors bg-transparent supports-[backdrop-filter]:bg-transparent">
      <div className="w-full flex h-14 sm:h-16 items-center justify-evenly px-3 sm:px-4 ">
        {/* Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Image
            src="/piko_logo.png"
            alt="Piko Logo"
            width={28}
            height={28}
            className="rounded-lg sm:w-8 sm:h-8"
          />
          <h1 className="text-lg sm:text-xl font-bold text-primary">Piko</h1>
        </div>

        {/* Search Bar - Hidden on mobile, visible on tablet+ */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <Button
            variant="outline"
            className="w-full justify-start text-sm text-muted-foreground border-border hover:border-ring bg-white/70 dark:bg-background"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Arama yapın...</span>
            <span className="lg:hidden">Ara...</span>
          </Button>
        </div>

        {/* Right Side - Mobile Search, Theme Toggle, Notifications & Profile */}
        <div className="flex items-center space-x-1 sm:space-x-2">
          {/* Mobile Search Button */}
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
            <span className="sr-only">Arama</span>
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications - Hidden on mobile */}
          <Button variant="ghost" size="icon" className="hidden sm:flex h-9 w-9 transition-all duration-200 hover:scale-110">
            <Bell className="h-4 w-4 transition-transform duration-200 hover:rotate-12" />
            <span className="sr-only">Bildirimler</span>
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
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
      {/* Unified Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-sm md:max-w-md mx-4 md:mx-auto">
          <DialogTitle className="sr-only">Kullanıcı Arama</DialogTitle>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <CommandInput 
              placeholder="Kullanıcı ara..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              {searchLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Arama yapılıyor...
                </div>
              ) : searchResults.length === 0 && searchQuery ? (
                <CommandEmpty>Kullanıcı bulunamadı.</CommandEmpty>
              ) : searchResults.length === 0 && !searchQuery ? (
                <div className="p-4 text-center text-muted-foreground">
                  Kullanıcı aramak için yazın...
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="font-medium mb-3">Kullanıcılar ({searchResults.length})</h3>
                  {searchResults.map((dbUser) => (
                    <div
                      key={dbUser.id}
                      onClick={() => handleUserSelect(dbUser.id)}
                      className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-accent rounded-lg border border-border mb-2"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {dbUser.name?.charAt(0) || dbUser.email?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {dbUser.name || 'İsim belirtilmemiş'}
                        </p>
                        <p className="text-sm text-muted-foreground">{dbUser.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </header>
  )
}
