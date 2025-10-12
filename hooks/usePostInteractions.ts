import { useState, useCallback } from 'react'
import { postInteractionService } from '@/lib/services/postInteractionService'

export function usePostInteractions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleLike = useCallback(async (postId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await postInteractionService.toggleLike(postId, userId)
      return result
    } catch (err) {
      setError('Failed to toggle like')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleRetweet = useCallback(async (postId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await postInteractionService.toggleRetweet(postId, userId)
      return result
    } catch (err) {
      setError('Failed to toggle retweet')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleBookmark = useCallback(async (postId: string, userId: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await postInteractionService.toggleBookmark(postId, userId)
      return result
    } catch (err) {
      setError('Failed to toggle bookmark')
      console.error(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    toggleLike,
    toggleRetweet,
    toggleBookmark,
    loading,
    error
  }
}

