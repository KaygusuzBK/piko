import { useState, useEffect, useCallback } from 'react'
import { User } from '@/lib/types'
import { userService } from '@/lib/services/userService'

export function useSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const performSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const searchResults = await userService.searchUsers(trimmed, 20)
      setResults(searchResults)
    } catch (err) {
      setError('Search failed')
      console.error(err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  const clearSearch = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch
  }
}

