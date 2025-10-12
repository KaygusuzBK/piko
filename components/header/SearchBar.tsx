'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useSearch } from '@/hooks/useSearch'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  isMobile?: boolean
}

export function SearchBar({ isMobile = false }: SearchBarProps) {
  const { query, setQuery, results, loading } = useSearch()
  const router = useRouter()

  const handleUserSelect = (userId: string) => {
    setQuery('')
    router.push(`/users/${userId}`)
  }

  const placeholder = isMobile ? 'Ara...' : 'Kullanıcı ara...'
  const className = isMobile
    ? 'md:hidden relative'
    : 'hidden md:block relative'

  return (
    <div className={className}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full px-3 md:px-4 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
      />

      {query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-60 md:max-h-72 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              Arama yapılıyor...
            </div>
          ) : results.length === 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              Kullanıcı bulunamadı.
            </div>
          ) : (
            <div className="p-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className="flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.avatar_url || undefined}
                      alt={user.name || user.email || 'Kullanıcı'}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {user.name || 'İsim belirtilmemiş'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

