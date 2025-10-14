/**
 * Moderation Service
 * 
 * Business logic layer for content moderation.
 * Handles reports, blocks, mutes, and moderation actions.
 */

import { moderationRepository } from '@/lib/repositories/moderationRepository'
import type {
  ContentReport,
  UserBlock,
  UserMute,
  ModerationAction,
  CreateReportData,
  ReportStats,
  BlockedUser,
  MutedUser,
  ReportWithDetails
} from '@/lib/types'

export class ModerationService {
  private moderationRepo = moderationRepository

  /**
   * Create a content report
   */
  async createReport(reportData: CreateReportData, reporterId: string): Promise<ContentReport | null> {
    try {
      // Validate report data
      if (!reportData.reported_content_id || !reportData.content_type || !reportData.reason) {
        throw new Error('Missing required report fields')
      }

      if (!['post', 'comment', 'user', 'message'].includes(reportData.content_type)) {
        throw new Error('Invalid content type')
      }

      if (reportData.reason.trim().length < 5) {
        throw new Error('Reason must be at least 5 characters')
      }

      return await this.moderationRepo.createReport(reportData, reporterId)
    } catch (error) {
      console.error('Error in createReport:', error)
      throw error
    }
  }

  /**
   * Get reports by user
   */
  async getUserReports(userId: string, limit: number = 20, offset: number = 0): Promise<ContentReport[]> {
    try {
      return await this.moderationRepo.getUserReports(userId, limit, offset)
    } catch (error) {
      console.error('Error in getUserReports:', error)
      return []
    }
  }

  /**
   * Get all reports (for moderators)
   */
  async getAllReports(limit: number = 50, offset: number = 0, status?: string): Promise<ReportWithDetails[]> {
    try {
      return await this.moderationRepo.getAllReports(limit, offset, status)
    } catch (error) {
      console.error('Error in getAllReports:', error)
      return []
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(
    reportId: string, 
    status: string, 
    moderatorId: string, 
    notes?: string
  ): Promise<boolean> {
    try {
      if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
        throw new Error('Invalid status')
      }

      return await this.moderationRepo.updateReportStatus(reportId, status, moderatorId, notes)
    } catch (error) {
      console.error('Error in updateReportStatus:', error)
      throw error
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      if (blockerId === blockedId) {
        throw new Error('Cannot block yourself')
      }

      // Check if already blocked
      const isBlocked = await this.moderationRepo.isUserBlocked(blockerId, blockedId)
      if (isBlocked) {
        return true // Already blocked
      }

      return await this.moderationRepo.blockUser(blockerId, blockedId)
    } catch (error) {
      console.error('Error in blockUser:', error)
      throw error
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      return await this.moderationRepo.unblockUser(blockerId, blockedId)
    } catch (error) {
      console.error('Error in unblockUser:', error)
      throw error
    }
  }

  /**
   * Mute a user
   */
  async muteUser(muterId: string, mutedId: string): Promise<boolean> {
    try {
      if (muterId === mutedId) {
        throw new Error('Cannot mute yourself')
      }

      // Check if already muted
      const isMuted = await this.moderationRepo.isUserMuted(muterId, mutedId)
      if (isMuted) {
        return true // Already muted
      }

      return await this.moderationRepo.muteUser(muterId, mutedId)
    } catch (error) {
      console.error('Error in muteUser:', error)
      throw error
    }
  }

  /**
   * Unmute a user
   */
  async unmuteUser(muterId: string, mutedId: string): Promise<boolean> {
    try {
      return await this.moderationRepo.unmuteUser(muterId, mutedId)
    } catch (error) {
      console.error('Error in unmuteUser:', error)
      throw error
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      return await this.moderationRepo.isUserBlocked(blockerId, blockedId)
    } catch (error) {
      console.error('Error in isUserBlocked:', error)
      return false
    }
  }

  /**
   * Check if user is muted
   */
  async isUserMuted(muterId: string, mutedId: string): Promise<boolean> {
    try {
      return await this.moderationRepo.isUserMuted(muterId, mutedId)
    } catch (error) {
      console.error('Error in isUserMuted:', error)
      return false
    }
  }

  /**
   * Get blocked users
   */
  async getBlockedUsers(userId: string): Promise<BlockedUser[]> {
    try {
      return await this.moderationRepo.getBlockedUsers(userId)
    } catch (error) {
      console.error('Error in getBlockedUsers:', error)
      return []
    }
  }

  /**
   * Get muted users
   */
  async getMutedUsers(userId: string): Promise<MutedUser[]> {
    try {
      return await this.moderationRepo.getMutedUsers(userId)
    } catch (error) {
      console.error('Error in getMutedUsers:', error)
      return []
    }
  }

  /**
   * Get report statistics
   */
  async getReportStats(): Promise<ReportStats | null> {
    try {
      return await this.moderationRepo.getReportStats()
    } catch (error) {
      console.error('Error in getReportStats:', error)
      return null
    }
  }

  /**
   * Create moderation action
   */
  async createModerationAction(
    moderatorId: string,
    targetUserId: string,
    actionType: string,
    reason: string,
    durationHours?: number
  ): Promise<ModerationAction | null> {
    try {
      if (!['warning', 'suspension', 'ban', 'content_removal'].includes(actionType)) {
        throw new Error('Invalid action type')
      }

      if (!reason || reason.trim().length < 5) {
        throw new Error('Reason must be at least 5 characters')
      }

      if (durationHours && durationHours < 1) {
        throw new Error('Duration must be at least 1 hour')
      }

      return await this.moderationRepo.createModerationAction(
        moderatorId,
        targetUserId,
        actionType,
        reason,
        durationHours
      )
    } catch (error) {
      console.error('Error in createModerationAction:', error)
      throw error
    }
  }

  /**
   * Get moderation actions for a user
   */
  async getUserModerationActions(userId: string): Promise<ModerationAction[]> {
    try {
      return await this.moderationRepo.getUserModerationActions(userId)
    } catch (error) {
      console.error('Error in getUserModerationActions:', error)
      return []
    }
  }

  /**
   * Check if user has active moderation actions
   */
  async hasActiveModerationActions(userId: string): Promise<boolean> {
    try {
      const actions = await this.moderationRepo.getUserModerationActions(userId)
      return actions.some(action => action.is_active)
    } catch (error) {
      console.error('Error in hasActiveModerationActions:', error)
      return false
    }
  }

  /**
   * Get user's moderation status
   */
  async getUserModerationStatus(userId: string): Promise<{
    isBlocked: boolean
    isMuted: boolean
    hasActiveActions: boolean
    actions: ModerationAction[]
  }> {
    try {
      const [actions, hasActiveActions] = await Promise.all([
        this.getUserModerationActions(userId),
        this.hasActiveModerationActions(userId)
      ])

      return {
        isBlocked: false, // This would need to be checked against current user
        isMuted: false,   // This would need to be checked against current user
        hasActiveActions,
        actions
      }
    } catch (error) {
      console.error('Error in getUserModerationStatus:', error)
      return {
        isBlocked: false,
        isMuted: false,
        hasActiveActions: false,
        actions: []
      }
    }
  }

  /**
   * Deactivate expired moderation actions
   */
  async deactivateExpiredActions(): Promise<boolean> {
    try {
      return await this.moderationRepo.deactivateExpiredActions()
    } catch (error) {
      console.error('Error in deactivateExpiredActions:', error)
      return false
    }
  }

  /**
   * Get moderation dashboard data
   */
  async getModerationDashboard(): Promise<{
    stats: ReportStats | null
    recentReports: ReportWithDetails[]
    pendingReports: ReportWithDetails[]
  }> {
    try {
      const [stats, recentReports, pendingReports] = await Promise.all([
        this.getReportStats(),
        this.getAllReports(10, 0),
        this.getAllReports(10, 0, 'pending')
      ])

      return {
        stats,
        recentReports,
        pendingReports
      }
    } catch (error) {
      console.error('Error in getModerationDashboard:', error)
      return {
        stats: null,
        recentReports: [],
        pendingReports: []
      }
    }
  }
}

// Singleton instance
export const moderationService = new ModerationService()
