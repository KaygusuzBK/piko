/**
 * Two-Factor Authentication Service
 * 
 * Handles TOTP generation, verification, backup codes, and session management.
 */

import * as speakeasy from 'speakeasy'
import * as QRCode from 'qrcode'
import { createClient } from '@/lib/supabase'
import type {
  TwoFactorSetup,
  TwoFactorVerification,
  TwoFactorStatus,
  TwoFactorSettings,
  TwoFactorBackupCode,
  TwoFactorSession
} from '@/lib/types'

export class TwoFactorService {
  private supabase = createClient()

  /**
   * Generate 2FA setup data
   */
  async generateSetup(userId: string, userEmail: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `SOC AI (${userEmail})`,
        issuer: 'SOC AI',
        length: 32
      })

      // Generate QR code URL
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

      // Generate backup codes
      const { data: backupCodes, error } = await this.supabase.rpc('generate_backup_codes', {
        user_id: userId,
        count: 10
      })

      if (error) {
        throw new Error('Failed to generate backup codes')
      }

      return {
        secret: secret.base32,
        qrCodeUrl,
        backupCodes: backupCodes || []
      }
    } catch (error) {
      console.error('Error generating 2FA setup:', error)
      throw error
    }
  }

  /**
   * Verify TOTP token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's secret
      const { data: user, error } = await this.supabase
        .from('users')
        .select('two_factor_secret')
        .eq('id', userId)
        .single()

      if (error || !user?.two_factor_secret) {
        throw new Error('User not found or 2FA not enabled')
      }

      // Verify token
      const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token,
        window: 2 // Allow 2 time windows (60 seconds)
      })

      return verified
    } catch (error) {
      console.error('Error verifying 2FA token:', error)
      return false
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('verify_backup_code', {
        user_id: userId,
        code: code.toUpperCase()
      })

      if (error) {
        console.error('Error verifying backup code:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error in verifyBackupCode:', error)
      return false
    }
  }

  /**
   * Enable 2FA for user
   */
  async enableTwoFactor(userId: string, secret: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('enable_two_factor_auth', {
        user_id: userId,
        secret
      })

      if (error) {
        console.error('Error enabling 2FA:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in enableTwoFactor:', error)
      return false
    }
  }

  /**
   * Disable 2FA for user
   */
  async disableTwoFactor(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('disable_two_factor_auth', {
        user_id: userId
      })

      if (error) {
        console.error('Error disabling 2FA:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in disableTwoFactor:', error)
      return false
    }
  }

  /**
   * Get 2FA status for user
   */
  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const { data: user, error } = await this.supabase
        .from('users')
        .select('two_factor_enabled, two_factor_setup_at')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user 2FA status:', error)
        return {
          enabled: false,
          backupCodesCount: 0,
          unusedBackupCodesCount: 0
        }
      }

      // Get backup codes count
      const { data: backupCodes, error: codesError } = await this.supabase.rpc('get_user_backup_codes', {
        user_id: userId
      })

      const totalCodes = backupCodes?.length || 0
      const unusedCodes = backupCodes?.filter((code: TwoFactorBackupCode) => !code.used).length || 0

      return {
        enabled: user?.two_factor_enabled || false,
        setup_at: user?.two_factor_setup_at,
        backupCodesCount: totalCodes,
        unusedBackupCodesCount: unusedCodes
      }
    } catch (error) {
      console.error('Error in getTwoFactorStatus:', error)
      return {
        enabled: false,
        backupCodesCount: 0,
        unusedBackupCodesCount: 0
      }
    }
  }

  /**
   * Get user's backup codes
   */
  async getBackupCodes(userId: string): Promise<TwoFactorBackupCode[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_backup_codes', {
        user_id: userId
      })

      if (error) {
        console.error('Error fetching backup codes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getBackupCodes:', error)
      return []
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(userId: string, count: number = 10): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.rpc('generate_backup_codes', {
        user_id: userId,
        count
      })

      if (error) {
        console.error('Error generating new backup codes:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in generateNewBackupCodes:', error)
      return []
    }
  }

  /**
   * Create 2FA session (for trusted devices)
   */
  async createSession(userId: string, durationHours: number = 24): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('create_two_factor_session', {
        user_id: userId,
        duration_hours: durationHours
      })

      if (error) {
        console.error('Error creating 2FA session:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createSession:', error)
      return null
    }
  }

  /**
   * Verify 2FA session
   */
  async verifySession(sessionToken: string): Promise<{ userId: string; isValid: boolean } | null> {
    try {
      const { data, error } = await this.supabase.rpc('verify_two_factor_session', {
        session_token: sessionToken
      })

      if (error || !data || data.length === 0) {
        return null
      }

      const session = data[0]
      return {
        userId: session.user_id,
        isValid: session.is_valid
      }
    } catch (error) {
      console.error('Error in verifySession:', error)
      return null
    }
  }

  /**
   * Get user's recent 2FA sessions
   */
  async getRecentSessions(userId: string, limit: number = 10): Promise<TwoFactorSession[]> {
    try {
      const { data, error } = await this.supabase
        .from('two_factor_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent sessions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getRecentSessions:', error)
      return []
    }
  }

  /**
   * Revoke all 2FA sessions for user
   */
  async revokeAllSessions(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('two_factor_sessions')
        .delete()
        .eq('user_id', userId)

      if (error) {
        console.error('Error revoking sessions:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in revokeAllSessions:', error)
      return false
    }
  }

  /**
   * Cleanup expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_two_factor_sessions')

      if (error) {
        console.error('Error cleaning up expired sessions:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error in cleanupExpiredSessions:', error)
      return 0
    }
  }

  /**
   * Get complete 2FA settings for user
   */
  async getTwoFactorSettings(userId: string): Promise<TwoFactorSettings> {
    try {
      const [status, backupCodes, recentSessions] = await Promise.all([
        this.getTwoFactorStatus(userId),
        this.getBackupCodes(userId),
        this.getRecentSessions(userId, 5)
      ])

      return {
        enabled: status.enabled,
        setup_at: status.setup_at,
        backupCodes,
        recentSessions
      }
    } catch (error) {
      console.error('Error in getTwoFactorSettings:', error)
      return {
        enabled: false,
        backupCodes: [],
        recentSessions: []
      }
    }
  }
}

// Singleton instance
export const twoFactorService = new TwoFactorService()
