import { useQuery } from '@tanstack/react-query'
import { useIntersection } from '@mantine/hooks'
import { useEffect, useRef, useState } from 'react'
import { PostWithAuthor } from '@/lib/types'
import { postQueryService } from '@/lib/services/postQueryService'
import { queryKeys } from '@/lib/utils/queryClient'

interface UseInfinitePostsOptions {
  userId?: string
  viewerUserId?: string
  limit?: number
  enabled?: boolean
}

export function useInfinitePosts({
  userId,
  viewerUserId,
  limit = 20,
  enabled = true
}: UseInfinitePostsOptions = {}) {
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const {
    data: currentPageData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [
      userId ? queryKeys.posts.user(userId, viewerUserId) : queryKeys.posts.feed(viewerUserId),
      { page: currentPage, limit }
    ],
    queryFn: async () => {
      try {
        if (userId) {
          const result = await postQueryService.getUserPosts(userId, limit, currentPage * limit, viewerUserId)
          return Array.isArray(result) ? result : []
        }
        const result = await postQueryService.getFeedPosts(limit, currentPage * limit, viewerUserId)
        return Array.isArray(result) ? result : []
      } catch (error) {
        console.error('Error fetching posts:', error)
        return []
      }
    },
    enabled: enabled && hasNextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  // Update all posts when new data arrives
  useEffect(() => {
    if (currentPageData && Array.isArray(currentPageData)) {
      if (currentPage === 0) {
        // First page - replace all posts
        setAllPosts(currentPageData)
      } else {
        // Subsequent pages - append to existing posts
        setAllPosts(prev => [...prev, ...currentPageData])
      }
      
      // Check if we have more pages
      setHasNextPage(currentPageData.length >= limit)
      setIsLoadingMore(false)
    }
  }, [currentPageData, currentPage, limit])

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { ref, entry } = useIntersection({
    root: loadMoreRef.current,
    threshold: 0.1,
  })

  const fetchNextPage = () => {
    if (hasNextPage && !isLoadingMore) {
      setIsLoadingMore(true)
      setCurrentPage(prev => prev + 1)
    }
  }

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isLoadingMore) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isLoadingMore])

  return {
    posts: allPosts,
    isLoading: isLoading && currentPage === 0,
    error,
    hasNextPage,
    isFetchingNextPage: isLoadingMore,
    loadMoreRef: ref,
    refetch: () => {
      setCurrentPage(0)
      setAllPosts([])
      setHasNextPage(true)
      refetch()
    }
  }
}

export function useInfiniteUserPosts(
  userId: string,
  viewerUserId?: string,
  limit: number = 20
) {
  return useInfinitePosts({
    userId,
    viewerUserId,
    limit,
    enabled: !!userId
  })
}

export function useInfiniteFeedPosts(
  viewerUserId?: string,
  limit: number = 20
) {
  return useInfinitePosts({
    viewerUserId,
    limit,
    enabled: true // Her zaman aktif olsun
  })
}
