import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pollService } from '@/lib/services/pollService'
import { queryKeys } from '@/lib/utils/queryClient'
import type { 
  Poll,
  PollWithResults,
  CreatePollData,
  VoteData
} from '@/lib/types'

/**
 * Hook for getting poll by ID
 */
export function usePoll(pollId?: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.polls.detail(pollId!),
    queryFn: () => pollService.getPollWithResults(pollId!, userId),
    enabled: !!pollId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for getting poll by post ID
 */
export function usePollByPostId(postId?: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.polls.post(postId!),
    queryFn: async () => {
      const poll = await pollService.getPollByPostId(postId!)
      if (!poll) return null
      return pollService.getPollWithResults(poll.id, userId)
    },
    enabled: !!postId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for creating a poll
 */
export function useCreatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pollData: CreatePollData) => pollService.createPoll(pollData),
    onSuccess: (newPoll, variables) => {
      // Invalidate polls queries
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.post(variables.post_id) })
      
      // Invalidate posts query to show poll in post
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.detail(variables.post_id) })
    },
  })
}

/**
 * Hook for voting on a poll
 */
export function useVoteOnPoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (voteData: VoteData) => pollService.voteOnPoll(voteData),
    onSuccess: (_, variables) => {
      // Invalidate poll queries to show updated results
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.detail(variables.poll_id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all })
      
      // Also invalidate any post queries that might show this poll
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
    },
  })
}

/**
 * Hook for updating a poll
 */
export function useUpdatePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ pollId, updates }: { pollId: string; updates: Partial<CreatePollData> }) =>
      pollService.updatePoll(pollId, updates),
    onSuccess: (_, variables) => {
      // Invalidate poll queries
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.detail(variables.pollId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all })
    },
  })
}

/**
 * Hook for deleting a poll
 */
export function useDeletePoll() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (pollId: string) => pollService.deletePoll(pollId),
    onSuccess: (_, pollId) => {
      // Invalidate poll queries
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.detail(pollId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.polls.all })
      
      // Also invalidate posts queries
      queryClient.invalidateQueries({ queryKey: queryKeys.posts.all })
    },
  })
}

/**
 * Hook for getting user's polls
 */
export function useUserPolls(userId?: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: queryKeys.polls.user(userId!, limit, offset),
    queryFn: () => pollService.getUserPolls(userId!, limit, offset),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 minute
  })
}

/**
 * Hook for getting trending polls
 */
export function useTrendingPolls(limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.polls.trending(limit),
    queryFn: () => pollService.getTrendingPolls(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  })
}

/**
 * Hook for checking if user has voted on a poll
 */
export function useHasUserVoted(pollId?: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.polls.userVote(pollId!, userId!),
    queryFn: () => pollService.hasUserVoted(pollId!, userId!),
    enabled: !!pollId && !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for getting user's votes on a poll
 */
export function useUserVotes(pollId?: string, userId?: string) {
  return useQuery({
    queryKey: queryKeys.polls.userVotes(pollId!, userId!),
    queryFn: () => pollService.getUserVotes(pollId!, userId!),
    enabled: !!pollId && !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
