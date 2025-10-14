import { useInfiniteQuery } from '@tanstack/react-query'
import { useIntersection } from '@mantine/hooks'
import { useEffect, useRef } from 'react'
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
  const {
    data,
    fetchNextPage,
    hasNextPage = false,
    isFetchingNextPage = false,
    isLoading = false,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: userId ? queryKeys.posts.user(userId, viewerUserId) : queryKeys.posts.feed(viewerUserId),
    queryFn: async ({ pageParam = 0 }) => {
      try {
        if (userId) {
          const result = await postQueryService.getUserPosts(userId, limit, pageParam, viewerUserId)
          return Array.isArray(result) ? result : []
        }
        const result = await postQueryService.getFeedPosts(limit, pageParam, viewerUserId)
        return Array.isArray(result) ? result : []
      } catch (error) {
        console.error('Error fetching posts:', error)
        return []
      }
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !Array.isArray(lastPage) || lastPage.length < limit) {
        return undefined
      }
      return (allPages?.length ?? 0) * limit
    },
    initialPageParam: 0,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })

  const posts = (data?.pages?.flat() ?? []) as PostWithAuthor[]
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { ref, entry } = useIntersection({
    root: loadMoreRef.current,
    threshold: 0.1,
  })

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage])

  return {
    posts,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    loadMoreRef: ref,
    refetch
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
