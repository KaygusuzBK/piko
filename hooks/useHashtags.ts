import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hashtagService } from '@/lib/services/hashtagService'
import { queryKeys } from '@/lib/utils/queryClient'
import type { 
  Hashtag,
  TrendingHashtag,
  CreateHashtagData,
  HashtagWithPosts
} from '@/lib/types'

/**
 * Hook for getting hashtag by name
 */
export function useHashtag(name?: string) {
  return useQuery({
    queryKey: queryKeys.hashtags.detail(name!),
    queryFn: () => hashtagService.getHashtagByName(name!),
    enabled: !!name,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting hashtag statistics
 */
export function useHashtagStats(hashtagName?: string) {
  return useQuery({
    queryKey: queryKeys.hashtags.stats(hashtagName!),
    queryFn: () => hashtagService.getHashtagStats(hashtagName!),
    enabled: !!hashtagName,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting trending hashtags
 */
export function useTrendingHashtags(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.hashtags.trending(limit),
    queryFn: () => hashtagService.getTrendingHashtags(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

/**
 * Hook for searching hashtags
 */
export function useSearchHashtags(query?: string, limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.hashtags.search(query!, limit),
    queryFn: () => hashtagService.searchHashtags(query!, limit),
    enabled: !!query && query.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting hashtag suggestions
 */
export function useHashtagSuggestions(partialInput?: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.hashtags.suggestions(partialInput!, limit),
    queryFn: () => hashtagService.getHashtagSuggestions(partialInput!, limit),
    enabled: !!partialInput,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook for getting posts for a hashtag
 */
export function useHashtagPosts(hashtagName?: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: queryKeys.hashtags.posts(hashtagName!, limit, offset),
    queryFn: () => hashtagService.getPostsForHashtag(hashtagName!, limit, offset),
    enabled: !!hashtagName,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting hashtags for a post
 */
export function usePostHashtags(postId?: string) {
  return useQuery({
    queryKey: queryKeys.hashtags.post(postId!),
    queryFn: () => hashtagService.getHashtagsForPost(postId!),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for creating a hashtag
 */
export function useCreateHashtag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (hashtagData: CreateHashtagData) => hashtagService.createHashtag(hashtagData),
    onSuccess: () => {
      // Invalidate hashtag queries
      queryClient.invalidateQueries({ queryKey: queryKeys.hashtags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.hashtags.trending() })
    },
  })
}

/**
 * Hook for processing post hashtags
 */
export function useProcessPostHashtags() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      hashtagService.processPostHashtags(postId, content),
    onSuccess: (_, variables) => {
      // Invalidate hashtag queries
      queryClient.invalidateQueries({ queryKey: queryKeys.hashtags.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.hashtags.trending() })
      
      // Invalidate post hashtags
      queryClient.invalidateQueries({ queryKey: queryKeys.hashtags.post(variables.postId) })
    },
  })
}

/**
 * Hook for getting popular hashtags
 */
export function usePopularHashtags(limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.hashtags.popular(limit),
    queryFn: () => hashtagService.getPopularHashtags(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for getting recent hashtags
 */
export function useRecentHashtags(limit: number = 20) {
  return useQuery({
    queryKey: queryKeys.hashtags.recent(limit),
    queryFn: () => hashtagService.getRecentHashtags(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for extracting hashtags from text
 */
export function useExtractHashtags() {
  return useMutation({
    mutationFn: (text: string) => hashtagService.extractHashtags(text),
  })
}
