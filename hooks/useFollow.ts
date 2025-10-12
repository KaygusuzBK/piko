import { useState, useEffect, useCallback } from 'react'
import {
  toggleFollow as toggleFollowService,
  checkFollowStatus,
  getFollowers as getFollowersService,
  getFollowing as getFollowingService,
  getFollowSuggestions as getFollowSuggestionsService,
} from '@/lib/services/followService'
import type { FollowStatus, FollowUser } from '@/lib/types/follow.types'

/**
 * Hook for managing follow status of a single user
 */
export function useFollowStatus(currentUserId: string | undefined, targetUserId: string) {
  const [followStatus, setFollowStatus] = useState<FollowStatus>({
    isFollowing: false,
    isFollowedBy: false,
  })
  const [loading, setLoading] = useState(true)

  const fetchFollowStatus = useCallback(async () => {
    if (!currentUserId || currentUserId === targetUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const status = await checkFollowStatus(currentUserId, targetUserId)
      setFollowStatus(status)
    } catch (error) {
      console.error('Error fetching follow status:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, targetUserId])

  useEffect(() => {
    fetchFollowStatus()
  }, [fetchFollowStatus])

  return { followStatus, loading, refresh: fetchFollowStatus }
}

/**
 * Hook for toggling follow status
 */
export function useToggleFollow() {
  const [loading, setLoading] = useState(false)

  const toggleFollow = useCallback(
    async (currentUserId: string, targetUserId: string): Promise<boolean> => {
      if (!currentUserId || currentUserId === targetUserId) {
        console.error('Invalid user IDs for follow toggle')
        return false
      }

      setLoading(true)
      try {
        const result = await toggleFollowService(currentUserId, targetUserId)
        return result.success
      } catch (error) {
        console.error('Error toggling follow:', error)
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return { toggleFollow, loading }
}

/**
 * Hook for getting followers list
 */
export function useFollowers(userId: string, currentUserId?: string, limit = 50) {
  const [followers, setFollowers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFollowers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFollowersService(userId, currentUserId, limit)
      setFollowers(data)
    } catch (error) {
      console.error('Error fetching followers:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, currentUserId, limit])

  useEffect(() => {
    fetchFollowers()
  }, [fetchFollowers])

  return { followers, loading, refresh: fetchFollowers }
}

/**
 * Hook for getting following list
 */
export function useFollowing(userId: string, currentUserId?: string, limit = 50) {
  const [following, setFollowing] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchFollowing = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getFollowingService(userId, currentUserId, limit)
      setFollowing(data)
    } catch (error) {
      console.error('Error fetching following:', error)
    } finally {
      setLoading(false)
    }
  }, [userId, currentUserId, limit])

  useEffect(() => {
    fetchFollowing()
  }, [fetchFollowing])

  return { following, loading, refresh: fetchFollowing }
}

/**
 * Hook for getting follow suggestions
 */
export function useFollowSuggestions(currentUserId: string | undefined, limit = 5) {
  const [suggestions, setSuggestions] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSuggestions = useCallback(async () => {
    if (!currentUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const data = await getFollowSuggestionsService(currentUserId, limit)
      setSuggestions(data)
    } catch (error) {
      console.error('Error fetching follow suggestions:', error)
    } finally {
      setLoading(false)
    }
  }, [currentUserId, limit])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  return { suggestions, loading, refresh: fetchSuggestions }
}

/**
 * Combined hook for complete follow functionality
 */
export function useFollow(currentUserId: string | undefined, targetUserId: string) {
  const { followStatus, loading: statusLoading, refresh } = useFollowStatus(
    currentUserId,
    targetUserId
  )
  const { toggleFollow, loading: toggleLoading } = useToggleFollow()

  const handleToggleFollow = useCallback(async () => {
    if (!currentUserId) return false

    const success = await toggleFollow(currentUserId, targetUserId)
    if (success) {
      await refresh()
    }
    return success
  }, [currentUserId, targetUserId, toggleFollow, refresh])

  return {
    followStatus,
    loading: statusLoading || toggleLoading,
    toggleFollow: handleToggleFollow,
    refresh,
  }
}

