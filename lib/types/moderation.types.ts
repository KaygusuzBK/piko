export interface ContentReport {
  id: string
  reporter_id: string
  reported_content_id: string
  content_type: 'post' | 'comment' | 'user' | 'message'
  reason: string
  description?: string
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed'
  moderator_id?: string
  moderator_notes?: string
  created_at: string
  updated_at: string
}

export interface UserBlock {
  blocker_id: string
  blocked_id: string
  created_at: string
}

export interface UserMute {
  muter_id: string
  muted_id: string
  created_at: string
}

export interface ModerationAction {
  id: string
  moderator_id: string
  target_user_id: string
  action_type: 'warning' | 'suspension' | 'ban' | 'content_removal'
  reason: string
  duration_hours?: number
  expires_at?: string
  is_active: boolean
  created_at: string
}

export interface CreateReportData {
  reported_content_id: string
  content_type: 'post' | 'comment' | 'user' | 'message'
  reason: string
  description?: string
}

export interface ReportStats {
  total_reports: number
  pending_reports: number
  resolved_reports: number
  dismissed_reports: number
}

export interface BlockedUser {
  blocked_id: string
  blocked_username: string
  blocked_name: string
  blocked_at: string
}

export interface MutedUser {
  muted_id: string
  muted_username: string
  muted_name: string
  muted_at: string
}

export interface ReportWithDetails extends ContentReport {
  reporter?: {
    id: string
    username: string
    name: string
    avatar_url?: string
  }
  moderator?: {
    id: string
    username: string
    name: string
  }
}
