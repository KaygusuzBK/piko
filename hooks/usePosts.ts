import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PostWithAuthor } from '@/lib/types'
import { postQueryService } from '@/lib/services/postQueryService'
import { queryKeys } from '@/lib/utils/queryClient'

export function useFeedPosts(userId?: string, limit: number = 1000) {
  const queryClient = useQueryClient()
  const [posts, setPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    data: fetchedPosts,
    isLoading,
    error: queryError,
    refetch
  } = useQuery({
    queryKey: queryKeys.posts.feed(userId),
    queryFn: () => postQueryService.getFeedPosts(limit, 0, userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 saniye
    refetchInterval: 60 * 1000, // Her 60 saniyede bir yenile
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })

  useEffect(() => {
    if (fetchedPosts && Array.isArray(fetchedPosts)) {
      setPosts(fetchedPosts)
      setLoading(false)
    }
  }, [fetchedPosts])

  useEffect(() => {
    if (queryError) {
      setError('Failed to load posts')
      setLoading(false)
    }
  }, [queryError])

  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading])

  const refresh = useCallback(() => {
    refetch()
  }, [refetch])

  const addNewPost = useCallback((newPost: PostWithAuthor) => {
    // Yeni post'u en üste ekle
    setPosts(prevPosts => [newPost, ...prevPosts])
    
    // Query cache'i de güncelle
    queryClient.setQueryData(
      queryKeys.posts.feed(userId),
      (oldData: PostWithAuthor[] | undefined) => {
        if (!oldData) return [newPost]
        return [newPost, ...oldData]
      }
    )
  }, [queryClient, userId])

  return {
    posts,
    setPosts,
    loading,
    error,
    refresh,
    addNewPost
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

