import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { twoFactorService } from '@/lib/services/twoFactorService'
import { queryKeys } from '@/lib/utils/queryClient'
import type { 
  TwoFactorSetup,
  TwoFactorVerification,
  TwoFactorStatus,
  TwoFactorSettings,
  TwoFactorBackupCode
} from '@/lib/types'
import { toast } from 'sonner'

/**
 * Hook for generating 2FA setup
 */
export function useGenerateTwoFactorSetup() {
  return useMutation({
    mutationFn: ({ userId, userEmail }: { userId: string; userEmail: string }) =>
      twoFactorService.generateSetup(userId, userEmail),
    onError: (error: Error) => {
      toast.error('2FA kurulumu oluşturulamadı', { description: error.message })
    },
  })
}

/**
 * Hook for verifying 2FA token
 */
export function useVerifyTwoFactorToken() {
  return useMutation({
    mutationFn: ({ userId, token }: { userId: string; token: string }) =>
      twoFactorService.verifyToken(userId, token),
    onError: (error: Error) => {
      toast.error('2FA doğrulaması başarısız', { description: error.message })
    },
  })
}

/**
 * Hook for verifying backup code
 */
export function useVerifyBackupCode() {
  return useMutation({
    mutationFn: ({ userId, code }: { userId: string; code: string }) =>
      twoFactorService.verifyBackupCode(userId, code),
    onError: (error: Error) => {
      toast.error('Yedek kod doğrulaması başarısız', { description: error.message })
    },
  })
}

/**
 * Hook for enabling 2FA
 */
export function useEnableTwoFactor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, secret }: { userId: string; secret: string }) =>
      twoFactorService.enableTwoFactor(userId, secret),
    onSuccess: () => {
      toast.success('2FA başarıyla etkinleştirildi')
      queryClient.invalidateQueries({ queryKey: queryKeys.twoFactor.all })
    },
    onError: (error: Error) => {
      toast.error('2FA etkinleştirilemedi', { description: error.message })
    },
  })
}

/**
 * Hook for disabling 2FA
 */
export function useDisableTwoFactor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => twoFactorService.disableTwoFactor(userId),
    onSuccess: () => {
      toast.success('2FA başarıyla devre dışı bırakıldı')
      queryClient.invalidateQueries({ queryKey: queryKeys.twoFactor.all })
    },
    onError: (error: Error) => {
      toast.error('2FA devre dışı bırakılamadı', { description: error.message })
    },
  })
}

/**
 * Hook for getting 2FA status
 */
export function useTwoFactorStatus(userId?: string) {
  return useQuery({
    queryKey: queryKeys.twoFactor.status(userId!),
    queryFn: () => twoFactorService.getTwoFactorStatus(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for getting backup codes
 */
export function useBackupCodes(userId?: string) {
  return useQuery({
    queryKey: queryKeys.twoFactor.backupCodes(userId!),
    queryFn: () => twoFactorService.getBackupCodes(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for generating new backup codes
 */
export function useGenerateNewBackupCodes() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, count }: { userId: string; count?: number }) =>
      twoFactorService.generateNewBackupCodes(userId, count),
    onSuccess: (newCodes, variables) => {
      toast.success(`${newCodes.length} yeni yedek kod oluşturuldu`)
      queryClient.invalidateQueries({ queryKey: queryKeys.twoFactor.backupCodes(variables.userId) })
    },
    onError: (error: Error) => {
      toast.error('Yeni yedek kodlar oluşturulamadı', { description: error.message })
    },
  })
}

/**
 * Hook for creating 2FA session
 */
export function useCreateTwoFactorSession() {
  return useMutation({
    mutationFn: ({ userId, durationHours }: { userId: string; durationHours?: number }) =>
      twoFactorService.createSession(userId, durationHours),
    onSuccess: (sessionToken) => {
      if (sessionToken) {
        // Store session token in localStorage for future requests
        localStorage.setItem('2fa_session', sessionToken)
        toast.success('Güvenilir cihaz olarak kaydedildi')
      }
    },
    onError: (error: Error) => {
      toast.error('Oturum oluşturulamadı', { description: error.message })
    },
  })
}

/**
 * Hook for verifying 2FA session
 */
export function useVerifyTwoFactorSession() {
  return useMutation({
    mutationFn: (sessionToken: string) => twoFactorService.verifySession(sessionToken),
    onError: (error: Error) => {
      console.error('Session verification failed:', error)
    },
  })
}

/**
 * Hook for getting recent sessions
 */
export function useRecentSessions(userId?: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys.twoFactor.sessions(userId!, limit),
    queryFn: () => twoFactorService.getRecentSessions(userId!, limit),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for revoking all sessions
 */
export function useRevokeAllSessions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => twoFactorService.revokeAllSessions(userId),
    onSuccess: () => {
      // Clear session token from localStorage
      localStorage.removeItem('2fa_session')
      toast.success('Tüm oturumlar iptal edildi')
      queryClient.invalidateQueries({ queryKey: queryKeys.twoFactor.all })
    },
    onError: (error: Error) => {
      toast.error('Oturumlar iptal edilemedi', { description: error.message })
    },
  })
}

/**
 * Hook for getting complete 2FA settings
 */
export function useTwoFactorSettings(userId?: string) {
  return useQuery({
    queryKey: queryKeys.twoFactor.settings(userId!),
    queryFn: () => twoFactorService.getTwoFactorSettings(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for checking if current device has valid 2FA session
 */
export function useCurrentDeviceSession() {
  return useQuery({
    queryKey: queryKeys.twoFactor.currentSession(),
    queryFn: async () => {
      const sessionToken = localStorage.getItem('2fa_session')
      if (!sessionToken) return null
      
      const result = await twoFactorService.verifySession(sessionToken)
      if (!result?.isValid) {
        localStorage.removeItem('2fa_session')
        return null
      }
      
      return result
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  })
}
