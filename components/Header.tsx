'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAuthStore } from '@/stores/authStore'
import { fetchUsers } from '@/lib/users'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
    console.log('handleSearch called with query:', query) // Debug
    if (!query.trim()) {
      setSearchResults([])
      return
      }

    setSearchLoading(true)
    try {
      console.log('Fetching users...') // Debug
      const users = await fetchUsers()
      console.log('Fetched users:', users) // Debug
      console.log('Users length:', users.length) // Debug
      
      const filtered = users.filter((u) => {
        const name = u.name?.toLowerCase() || ''
        const email = u.email?.toLowerCase() || ''
        const searchTerm = query.toLowerCase()
        
        const nameMatch = name.includes(searchTerm)
        const emailMatch = email.includes(searchTerm)
        
        console.log(`User ${u.name}: name="${name}", email="${email}", search="${searchTerm}", nameMatch=${nameMatch}, emailMatch=${emailMatch}`) // Debug
        
        return nameMatch || emailMatch
      })
      console.log('Filtered results:', filtered) // Debug
      console.log('Filtered length:', filtered.length) // Debug
      setSearchResults(filtered)
      console.log('Setting search results to:', filtered) // Debug
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
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery, handleSearch])

  // Debug searchResults changes
  useEffect(() => {
    console.log('searchResults updated:', searchResults)
  }, [searchResults])

  const handleUserSelect = (userId: string) => {
    setSearchOpen(false)
    setSearchQuery('')
    router.push(`/users/${userId}`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <Image
            src="/piko_logo.png"
            alt="Piko Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <h1 className="text-xl font-bold text-primary">Piko</h1>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-sm text-muted-foreground"
              >
                <Search className="mr-2 h-4 w-4" />
                Arama yapın...
              </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden p-0">
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
                      {searchResults.map((dbUser) => {
                        console.log('Rendering user:', dbUser) // Debug
                        return (
                          <div
                            key={dbUser.id}
                            onClick={() => handleUserSelect(dbUser.id)}
                            className="flex items-center space-x-3 p-3 cursor-pointer hover:bg-accent rounded-lg border mb-2"
                          >
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
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
                        )
                      })}
                    </div>
                  )}
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Side - Theme Toggle, Notifications & Profile */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
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
              <DropdownMenuItem>
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
    </header>
  )
}
