import { useState, useEffect, useCallback } from 'react'
import { PostWithAuthor } from '@/lib/types'
import { postQueryService } from '@/lib/services/postQueryService'

export function useFeedPosts(userId?: string, limit: number = 1000) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const fetchedPosts = await postQueryService.getFeedPosts(limit, 0, userId)
      setPosts(fetchedPosts)
    } catch (err) {
      setError('Failed to load posts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const refresh = useCallback(() => {
    loadPosts()
  }, [loadPosts])

  return {
    posts,
    setPosts,
    loading,
    error,
    refresh
  }
}

export function useUserPosts(userId: string, viewerUserId?: string, limit: number = 20) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [likedPosts, setLikedPosts] = useState<PostWithAuthor[]>([])
  const [favoritePosts, setFavoritePosts] = useState<PostWithAuthor[]>([])
  const [mediaPosts, setMediaPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAllPosts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const [p, lp, fp, mp] = await Promise.all([
        postQueryService.getUserPosts(userId, limit, 0, viewerUserId),
        postQueryService.getUserLikedPosts(userId, limit, 0, viewerUserId),
        postQueryService.getUserFavoritePosts(userId, limit, 0, viewerUserId),
        postQueryService.getUserMediaPosts(userId, limit, 0, viewerUserId)
      ])
      setPosts(p)
      setLikedPosts(lp)
      setFavoritePosts(fp)
      setMediaPosts(mp)
    } catch (err) {
      setError('Failed to load user posts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, viewerUserId, limit])

  useEffect(() => {
    loadAllPosts()
  }, [loadAllPosts])

  const refresh = useCallback(() => {
    loadAllPosts()
  }, [loadAllPosts])

  return {
    posts,
    likedPosts,
    favoritePosts,
    mediaPosts,
    setPosts,
    setLikedPosts,
    setFavoritePosts,
    setMediaPosts,
    loading,
    error,
    refresh
  }
}

export function useFavoritePosts(userId?: string, limit: number = 100) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPosts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const fetchedPosts = await postQueryService.getUserFavoritePosts(userId, limit, 0, userId)
      setPosts(fetchedPosts)
    } catch (err) {
      setError('Failed to load favorite posts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  const refresh = useCallback(() => {
    loadPosts()
  }, [loadPosts])

  return {
    posts,
    setPosts,
    loading,
    error,
    refresh
  }
}

