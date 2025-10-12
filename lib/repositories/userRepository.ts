import { createClient } from '@/lib/supabase'
import { User, UpdateUserPayload, ImageUploadType, NotificationPreferences } from '@/lib/types'

export class UserRepository {
  private supabase = createClient()

  async findById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching user by id:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user by id:', error)
      return null
    }
  }

  async update(id: string, payload: UpdateUserPayload): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()

      if (error) {
        console.error('Error updating user:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }

  async search(query: string, limit: number = 20): Promise<User[]> {
    try {
      const trimmed = query.trim()
      if (!trimmed) return []

      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${trimmed}%,email.ilike.%${trimmed}%`)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching users:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error searching users:', error)
      return []
    }
  }

  async uploadImage(
    userId: string,
    file: File,
    type: ImageUploadType
  ): Promise<string | null> {
    try {
      const bucket = type === 'avatar' ? 'avatars' : 'banners'
      const ext = file.name.split('.').pop() || 'png'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: uploadError } = await this.supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = this.supabase.storage.from(bucket).getPublicUrl(path)
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  async ensureProfile(userId: string): Promise<boolean> {
    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('users')
        .select('id, username')
        .eq('id', userId)
        .single()

      if (existingUser && existingUser.username) {
        return true
      }

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking user:', checkError)
        return false
      }

      // Get auth user data
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user found')
        return false
      }

      // Generate unique username
      let baseUsername = user.user_metadata?.user_name ||
        user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '') ||
        user.email?.split('@')[0] ||
        `user_${userId.slice(0, 8)}`

      baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '')

      let username = baseUsername
      let counter = 1

      while (true) {
        const { data: existingUsername } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', username)
          .single()

        if (!existingUsername) break

        username = `${baseUsername}_${counter}`
        counter++

        if (counter > 1000) {
          username = `user_${userId.slice(0, 8)}_${Date.now()}`
          break
        }
      }

      // Update or skip (handled by trigger)
      if (existingUser) {
        const { error: updateError } = await this.supabase
          .from('users')
          .update({
            username: username,
            avatar_url: user.user_metadata?.avatar_url,
            bio: '',
            website: '',
            location: ''
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating user profile:', updateError)
          return false
        }
      }

      return true
    } catch (error) {
      console.error('Error ensuring profile:', error)
      return false
    }
  }

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching notification preferences:', error)
        return null
      }

      return data?.notification_preferences as NotificationPreferences || null
    } catch (error) {
      console.error('Error in getNotificationPreferences:', error)
      return null
    }
  }

  /**
   * Update notification preferences for a user
   */
  async updateNotificationPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      // First, get current preferences
      const current = await this.getNotificationPreferences(userId)
      
      // Merge with new preferences
      const updated = {
        ...current,
        ...preferences
      }

      const { error } = await this.supabase
        .from('users')
        .update({ notification_preferences: updated })
        .eq('id', userId)

      if (error) {
        console.error('Error updating notification preferences:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateNotificationPreferences:', error)
      return false
    }
  }

  /**
   * Update email notifications enabled status
   */
  async updateEmailNotificationsEnabled(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ email_notifications_enabled: enabled })
        .eq('id', userId)

      if (error) {
        console.error('Error updating email notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateEmailNotificationsEnabled:', error)
      return false
    }
  }

  /**
   * Update push notifications enabled status
   */
  async updatePushNotificationsEnabled(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ push_notifications_enabled: enabled })
        .eq('id', userId)

      if (error) {
        console.error('Error updating push notifications:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePushNotificationsEnabled:', error)
      return false
    }
  }
}

// Singleton instance
export const userRepository = new UserRepository()

