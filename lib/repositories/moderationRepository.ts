/**
 * Moderation Repository
 * 
 * Data access layer for content moderation.
 * Handles reports, blocks, mutes, and moderation actions.
 */

import { createClient } from '@/lib/supabase'
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

export class ModerationRepository {
  private supabase = createClient()
  
  // Expose supabase for service layer
  get supabaseClient() {
    return this.supabase
  }

  /**
   * Create a content report
   */
  async createReport(reportData: CreateReportData, reporterId: string): Promise<ContentReport | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_reports')
        .insert({
          reporter_id: reporterId,
          reported_content_id: reportData.reported_content_id,
          content_type: reportData.content_type,
          reason: reportData.reason,
          description: reportData.description
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating report:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createReport:', error)
      return null
    }
  }

  /**
   * Get reports by user
   */
  async getUserReports(userId: string, limit: number = 20, offset: number = 0): Promise<ContentReport[]> {
    try {
      const { data, error } = await this.supabase
        .from('content_reports')
        .select('*')
        .eq('reporter_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching user reports:', error)
        return []
      }

      return data || []
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
      let query = this.supabase
        .from('content_reports')
        .select(`
          *,
          reporter:reporter_id (
            id,
            username,
            name,
            avatar_url
          ),
          moderator:moderator_id (
            id,
            username,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching all reports:', error)
        return []
      }

      return data || []
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
      const { error } = await this.supabase
        .from('content_reports')
        .update({
          status,
          moderator_id: moderatorId,
          moderator_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) {
        console.error('Error updating report status:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateReportStatus:', error)
      return false
    }
  }

  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_blocks')
        .insert({
          blocker_id: blockerId,
          blocked_id: blockedId
        })

      if (error) {
        console.error('Error blocking user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in blockUser:', error)
      return false
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId)

      if (error) {
        console.error('Error unblocking user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in unblockUser:', error)
      return false
    }
  }

  /**
   * Mute a user
   */
  async muteUser(muterId: string, mutedId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_mutes')
        .insert({
          muter_id: muterId,
          muted_id: mutedId
        })

      if (error) {
        console.error('Error muting user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in muteUser:', error)
      return false
    }
  }

  /**
   * Unmute a user
   */
  async unmuteUser(muterId: string, mutedId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('user_mutes')
        .delete()
        .eq('muter_id', muterId)
        .eq('muted_id', mutedId)

      if (error) {
        console.error('Error unmuting user:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in unmuteUser:', error)
      return false
    }
  }

  /**
   * Check if user is blocked
   */
  async isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('is_user_blocked', {
        blocker_id: blockerId,
        blocked_id: blockedId
      })

      if (error) {
        console.error('Error checking if user is blocked:', error)
        return false
      }

      return data || false
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
      const { data, error } = await this.supabase.rpc('is_user_muted', {
        muter_id: muterId,
        muted_id: mutedId
      })

      if (error) {
        console.error('Error checking if user is muted:', error)
        return false
      }

      return data || false
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
      const { data, error } = await this.supabase.rpc('get_blocked_users', {
        user_id: userId
      })

      if (error) {
        console.error('Error fetching blocked users:', error)
        return []
      }

      return data || []
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
      const { data, error } = await this.supabase.rpc('get_muted_users', {
        user_id: userId
      })

      if (error) {
        console.error('Error fetching muted users:', error)
        return []
      }

      return data || []
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
      const { data, error } = await this.supabase.rpc('get_report_stats')

      if (error) {
        console.error('Error fetching report stats:', error)
        return null
      }

      return data?.[0] || null
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
      const expiresAt = durationHours 
        ? new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString()
        : null

      const { data, error } = await this.supabase
        .from('moderation_actions')
        .insert({
          moderator_id: moderatorId,
          target_user_id: targetUserId,
          action_type: actionType,
          reason,
          duration_hours: durationHours,
          expires_at: expiresAt
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating moderation action:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createModerationAction:', error)
      return null
    }
  }

  /**
   * Get moderation actions for a user
   */
  async getUserModerationActions(userId: string): Promise<ModerationAction[]> {
    try {
      const { data, error } = await this.supabase
        .from('moderation_actions')
        .select('*')
        .eq('target_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching user moderation actions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserModerationActions:', error)
      return []
    }
  }

  /**
   * Deactivate expired moderation actions
   */
  async deactivateExpiredActions(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('moderation_actions')
        .update({ is_active: false })
        .lt('expires_at', new Date().toISOString())
        .eq('is_active', true)

      if (error) {
        console.error('Error deactivating expired actions:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deactivateExpiredActions:', error)
      return false
    }
  }
}

// Singleton instance
export const moderationRepository = new ModerationRepository()
