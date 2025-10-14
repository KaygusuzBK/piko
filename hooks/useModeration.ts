import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { moderationService } from '@/lib/services/moderationService'
import { queryKeys } from '@/lib/utils/queryClient'
import type { 
  ContentReport,
  CreateReportData,
  ReportStats,
  BlockedUser,
  MutedUser,
  ReportWithDetails,
  ModerationAction
} from '@/lib/types'
import { toast } from 'sonner'

/**
 * Hook for creating a content report
 */
export function useCreateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportData, reporterId }: { reportData: CreateReportData; reporterId: string }) =>
      moderationService.createReport(reportData, reporterId),
    onSuccess: () => {
      toast.success('Rapor başarıyla gönderildi')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all })
    },
    onError: (error: Error) => {
      toast.error('Rapor gönderilemedi', { description: error.message })
    },
  })
}

/**
 * Hook for getting user reports
 */
export function useUserReports(userId?: string, limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: queryKeys.moderation.userReports(userId!, limit, offset),
    queryFn: () => moderationService.getUserReports(userId!, limit, offset),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting all reports (moderators)
 */
export function useAllReports(limit: number = 50, offset: number = 0, status?: string) {
  return useQuery({
    queryKey: queryKeys.moderation.allReports(limit, offset, status),
    queryFn: () => moderationService.getAllReports(limit, offset, status),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for updating report status
 */
export function useUpdateReportStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportId, status, moderatorId, notes }: {
      reportId: string
      status: string
      moderatorId: string
      notes?: string
    }) => moderationService.updateReportStatus(reportId, status, moderatorId, notes),
    onSuccess: () => {
      toast.success('Rapor durumu güncellendi')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all })
    },
    onError: (error: Error) => {
      toast.error('Rapor durumu güncellenemedi', { description: error.message })
    },
  })
}

/**
 * Hook for blocking a user
 */
export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blockerId, blockedId }: { blockerId: string; blockedId: string }) =>
      moderationService.blockUser(blockerId, blockedId),
    onSuccess: () => {
      toast.success('Kullanıcı engellendi')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.blocks() })
    },
    onError: (error: Error) => {
      toast.error('Kullanıcı engellenemedi', { description: error.message })
    },
  })
}

/**
 * Hook for unblocking a user
 */
export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ blockerId, blockedId }: { blockerId: string; blockedId: string }) =>
      moderationService.unblockUser(blockerId, blockedId),
    onSuccess: () => {
      toast.success('Kullanıcı engeli kaldırıldı')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.blocks() })
    },
    onError: (error: Error) => {
      toast.error('Kullanıcı engeli kaldırılamadı', { description: error.message })
    },
  })
}

/**
 * Hook for muting a user
 */
export function useMuteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ muterId, mutedId }: { muterId: string; mutedId: string }) =>
      moderationService.muteUser(muterId, mutedId),
    onSuccess: () => {
      toast.success('Kullanıcı susturuldu')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.mutes() })
    },
    onError: (error: Error) => {
      toast.error('Kullanıcı susturulamadı', { description: error.message })
    },
  })
}

/**
 * Hook for unmuting a user
 */
export function useUnmuteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ muterId, mutedId }: { muterId: string; mutedId: string }) =>
      moderationService.unmuteUser(muterId, mutedId),
    onSuccess: () => {
      toast.success('Kullanıcı susturma kaldırıldı')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.mutes() })
    },
    onError: (error: Error) => {
      toast.error('Kullanıcı susturma kaldırılamadı', { description: error.message })
    },
  })
}

/**
 * Hook for checking if user is blocked
 */
export function useIsUserBlocked(blockerId?: string, blockedId?: string) {
  return useQuery({
    queryKey: queryKeys.moderation.isBlocked(blockerId!, blockedId!),
    queryFn: () => moderationService.isUserBlocked(blockerId!, blockedId!),
    enabled: !!blockerId && !!blockedId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for checking if user is muted
 */
export function useIsUserMuted(muterId?: string, mutedId?: string) {
  return useQuery({
    queryKey: queryKeys.moderation.isMuted(muterId!, mutedId!),
    queryFn: () => moderationService.isUserMuted(muterId!, mutedId!),
    enabled: !!muterId && !!mutedId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting blocked users
 */
export function useBlockedUsers(userId?: string) {
  return useQuery({
    queryKey: queryKeys.moderation.blockedUsers(userId!),
    queryFn: () => moderationService.getBlockedUsers(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting muted users
 */
export function useMutedUsers(userId?: string) {
  return useQuery({
    queryKey: queryKeys.moderation.mutedUsers(userId!),
    queryFn: () => moderationService.getMutedUsers(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting report statistics
 */
export function useReportStats() {
  return useQuery({
    queryKey: queryKeys.moderation.stats(),
    queryFn: () => moderationService.getReportStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for creating moderation action
 */
export function useCreateModerationAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ moderatorId, targetUserId, actionType, reason, durationHours }: {
      moderatorId: string
      targetUserId: string
      actionType: string
      reason: string
      durationHours?: number
    }) => moderationService.createModerationAction(moderatorId, targetUserId, actionType, reason, durationHours),
    onSuccess: () => {
      toast.success('Moderasyon eylemi oluşturuldu')
      queryClient.invalidateQueries({ queryKey: queryKeys.moderation.all })
    },
    onError: (error: Error) => {
      toast.error('Moderasyon eylemi oluşturulamadı', { description: error.message })
    },
  })
}

/**
 * Hook for getting user moderation actions
 */
export function useUserModerationActions(userId?: string) {
  return useQuery({
    queryKey: queryKeys.moderation.userActions(userId!),
    queryFn: () => moderationService.getUserModerationActions(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting moderation dashboard data
 */
export function useModerationDashboard() {
  return useQuery({
    queryKey: queryKeys.moderation.dashboard(),
    queryFn: () => moderationService.getModerationDashboard(),
    staleTime: 30 * 1000, // 30 seconds
  })
}
