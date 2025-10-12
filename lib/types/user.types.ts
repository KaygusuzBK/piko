export interface User {
  id: string
  email?: string
  name?: string
  username?: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  website?: string
  location?: string
  phone?: string
  followers_count?: number
  following_count?: number
  unread_notifications_count?: number
  email_notifications_enabled?: boolean
  push_notifications_enabled?: boolean
  notification_preferences?: {
    like: boolean
    comment: boolean
    retweet: boolean
    follow: boolean
    mention: boolean
    reply: boolean
    weekly_summary: boolean
  }
  created_at?: string
  updated_at?: string
}

export type UpdateUserPayload = Partial<
  Pick<
    User,
    'name' | 'username' | 'avatar_url' | 'banner_url' | 'bio' | 'website' | 'location' | 'phone'
  >
>

export type ImageUploadType = 'avatar' | 'banner'

