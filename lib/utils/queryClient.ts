import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && 'status' in error) {
          const status = (error as Error & { status: number }).status
          if (status >= 400 && status < 500) {
            return false
          }
        }
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query keys factory
export const queryKeys = {
  posts: {
    all: ['posts'] as const,
    feed: (userId?: string) => ['posts', 'feed', userId] as const,
    user: (userId: string, viewerId?: string) => ['posts', 'user', userId, viewerId] as const,
    detail: (postId: string) => ['posts', 'detail', postId] as const,
    liked: (userId: string, viewerId?: string) => ['posts', 'liked', userId, viewerId] as const,
    bookmarked: (userId: string, viewerId?: string) => ['posts', 'bookmarked', userId, viewerId] as const,
    media: (userId: string, viewerId?: string) => ['posts', 'media', userId, viewerId] as const,
  },
  users: {
    all: ['users'] as const,
    profile: (userId: string) => ['users', 'profile', userId] as const,
    search: (query: string) => ['users', 'search', query] as const,
    followers: (userId: string) => ['users', 'followers', userId] as const,
    following: (userId: string) => ['users', 'following', userId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    user: (userId: string) => ['notifications', 'user', userId] as const,
    unreadCount: (userId: string) => ['notifications', 'unreadCount', userId] as const,
  },
  comments: {
    all: ['comments'] as const,
    post: (postId: string) => ['comments', 'post', postId] as const,
  },
  conversations: {
    all: ['conversations'] as const,
    user: (userId: string) => ['conversations', 'user', userId] as const,
    detail: (conversationId: string) => ['conversations', 'detail', conversationId] as const,
  },
  messages: {
    all: ['messages'] as const,
    conversation: (conversationId: string) => ['messages', 'conversation', conversationId] as const,
    unreadCount: (userId: string) => ['messages', 'unreadCount', userId] as const,
  },
  polls: {
    all: ['polls'] as const,
    detail: (pollId: string) => ['polls', 'detail', pollId] as const,
    post: (postId: string) => ['polls', 'post', postId] as const,
    user: (userId: string, limit?: number, offset?: number) => ['polls', 'user', userId, limit, offset] as const,
    trending: (limit: number) => ['polls', 'trending', limit] as const,
    userVote: (pollId: string, userId: string) => ['polls', 'userVote', pollId, userId] as const,
    userVotes: (pollId: string, userId: string) => ['polls', 'userVotes', pollId, userId] as const,
  },
  hashtags: {
    all: ['hashtags'] as const,
    detail: (name: string) => ['hashtags', 'detail', name] as const,
    search: (query: string, limit?: number) => ['hashtags', 'search', query, limit] as const,
    trending: (limit?: number) => ['hashtags', 'trending', limit] as const,
    popular: (limit?: number) => ['hashtags', 'popular', limit] as const,
    recent: (limit?: number) => ['hashtags', 'recent', limit] as const,
    suggestions: (partialInput: string, limit?: number) => ['hashtags', 'suggestions', partialInput, limit] as const,
    posts: (hashtagName: string, limit?: number, offset?: number) => ['hashtags', 'posts', hashtagName, limit, offset] as const,
    post: (postId: string) => ['hashtags', 'post', postId] as const,
    stats: (hashtagName: string) => ['hashtags', 'stats', hashtagName] as const,
  },
  moderation: {
    all: ['moderation'] as const,
    userReports: (userId: string, limit?: number, offset?: number) => ['moderation', 'userReports', userId, limit, offset] as const,
    allReports: (limit?: number, offset?: number, status?: string) => ['moderation', 'allReports', limit, offset, status] as const,
    stats: () => ['moderation', 'stats'] as const,
    blocks: () => ['moderation', 'blocks'] as const,
    mutes: () => ['moderation', 'mutes'] as const,
    isBlocked: (blockerId: string, blockedId: string) => ['moderation', 'isBlocked', blockerId, blockedId] as const,
    isMuted: (muterId: string, mutedId: string) => ['moderation', 'isMuted', muterId, mutedId] as const,
    blockedUsers: (userId: string) => ['moderation', 'blockedUsers', userId] as const,
    mutedUsers: (userId: string) => ['moderation', 'mutedUsers', userId] as const,
    userActions: (userId: string) => ['moderation', 'userActions', userId] as const,
    dashboard: () => ['moderation', 'dashboard'] as const,
  },
  twoFactor: {
    all: ['twoFactor'] as const,
    status: (userId: string) => ['twoFactor', 'status', userId] as const,
    backupCodes: (userId: string) => ['twoFactor', 'backupCodes', userId] as const,
    sessions: (userId: string, limit?: number) => ['twoFactor', 'sessions', userId, limit] as const,
    settings: (userId: string) => ['twoFactor', 'settings', userId] as const,
    currentSession: () => ['twoFactor', 'currentSession'] as const,
  },
  analytics: {
    all: ['analytics'] as const,
    userAnalytics: (userId: string, startDate?: string, endDate?: string) => ['analytics', 'user', userId, startDate, endDate] as const,
    userSummary: (userId: string, days?: number) => ['analytics', 'userSummary', userId, days] as const,
    postAnalytics: (postId: string, startDate?: string, endDate?: string) => ['analytics', 'post', postId, startDate, endDate] as const,
    trendingHashtags: (days?: number, limit?: number) => ['analytics', 'trendingHashtags', days, limit] as const,
    appAnalytics: (startDate?: string, endDate?: string) => ['analytics', 'app', startDate, endDate] as const,
    appSummary: (days?: number) => ['analytics', 'appSummary', days] as const,
        chartData: (filters: Record<string, unknown>) => ['analytics', 'chartData', filters] as const,
  },
} as const
