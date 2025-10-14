import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analyticsService } from '@/lib/services/analyticsService'
import { queryKeys } from '@/lib/utils/queryClient'
import type {
  UserAnalytics,
  PostAnalytics,
  AppAnalytics,
  UserAnalyticsSummary,
  TrendingHashtag,
  AppAnalyticsSummary,
  AnalyticsChartData,
  AnalyticsFilters
} from '@/lib/types'

/**
 * Hook for getting user analytics
 */
export function useUserAnalytics(userId?: string, days: number = 30) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  return useQuery({
    queryKey: queryKeys.analytics.userAnalytics(userId!, startDate, endDate),
    queryFn: () => analyticsService.getUserAnalytics(userId!, startDate, endDate),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting user analytics summary
 */
export function useUserAnalyticsSummary(userId?: string, days: number = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.userSummary(userId!, days),
    queryFn: () => analyticsService.getUserAnalyticsSummary(userId!, days),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting post analytics
 */
export function usePostAnalytics(postId?: string, days: number = 30) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  return useQuery({
    queryKey: queryKeys.analytics.postAnalytics(postId!, startDate, endDate),
    queryFn: () => analyticsService.getPostAnalytics(postId!, startDate, endDate),
    enabled: !!postId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting trending hashtags
 */
export function useTrendingHashtags(days: number = 7, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.analytics.trendingHashtags(days, limit),
    queryFn: () => analyticsService.getTrendingHashtags(days, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for getting app analytics summary
 */
export function useAppAnalyticsSummary(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.analytics.appSummary(days),
    queryFn: () => analyticsService.getAppAnalyticsSummary(days),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting app analytics
 */
export function useAppAnalytics(days: number = 30) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]

  return useQuery({
    queryKey: queryKeys.analytics.appAnalytics(startDate, endDate),
    queryFn: () => analyticsService.getAppAnalytics(startDate, endDate),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting analytics chart data
 */
export function useAnalyticsChartData(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: queryKeys.analytics.chartData(filters as unknown as Record<string, unknown>),
    queryFn: () => analyticsService.getAnalyticsChartData(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for tracking profile view
 */
export function useTrackProfileView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ viewedUserId, viewerUserId }: { viewedUserId: string; viewerUserId?: string }) =>
      analyticsService.trackProfileView(viewedUserId, viewerUserId),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userAnalytics(variables.viewedUserId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userSummary(variables.viewedUserId) 
      })
    },
  })
}

/**
 * Hook for tracking post impression
 */
export function useTrackPostImpression() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId?: string }) =>
      analyticsService.trackPostImpression(postId, userId),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.postAnalytics(variables.postId) 
      })
      if (variables.userId) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.analytics.userAnalytics(variables.userId) 
        })
      }
    },
  })
}

/**
 * Hook for tracking engagement
 */
export function useTrackEngagement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, authorId, type }: { 
      postId: string; 
      authorId: string; 
      type: 'like' | 'comment' | 'retweet' 
    }) => analyticsService.trackEngagement(postId, authorId, type),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.postAnalytics(variables.postId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userAnalytics(variables.authorId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userSummary(variables.authorId) 
      })
    },
  })
}

/**
 * Hook for tracking follower change
 */
export function useTrackFollowerChange() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, type }: { userId: string; type: 'gained' | 'lost' }) =>
      analyticsService.trackFollowerChange(userId, type),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userAnalytics(variables.userId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userSummary(variables.userId) 
      })
    },
  })
}

/**
 * Hook for tracking post creation
 */
export function useTrackPostCreation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => analyticsService.trackPostCreation(userId),
    onSuccess: (_, userId) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userAnalytics(userId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.userSummary(userId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.analytics.appAnalytics() 
      })
    },
  })
}
