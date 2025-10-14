/**
 * Stories Service
 * 
 * Handles story creation, viewing, reactions, and analytics.
 */

import { createClient } from '@/lib/supabase'
import type {
  Story,
  StoryWithStats,
  StoryUser,
  StoryAnalytics,
  CreateStoryData,
  StoryViewer,
  StoryReactionSummary
} from '@/lib/types'

export class StoryService {
  private supabase = createClient()

  /**
   * Create a new story
   */
  async createStory(userId: string, data: CreateStoryData): Promise<Story | null> {
    try {
      const { data: storyId, error } = await this.supabase.rpc('create_story', {
        p_user_id: userId,
        p_media_url: data.media_url,
        p_media_type: data.media_type,
        p_duration: data.duration || 5,
        p_expires_hours: data.expires_hours || 24
      })

      if (error) {
        console.error('Error creating story:', error)
        return null
      }

      // Add mentions if provided
      if (data.mentions && data.mentions.length > 0) {
        await this.addStoryMentions(storyId, data.mentions)
      }

      // Get the created story
      const { data: story, error: fetchError } = await this.supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (fetchError) {
        console.error('Error fetching created story:', fetchError)
        return null
      }

      return story
    } catch (error) {
      console.error('Error in createStory:', error)
      return null
    }
  }

  /**
   * Get user's stories
   */
  async getUserStories(userId: string, viewerId?: string): Promise<StoryWithStats[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_stories', {
        p_user_id: userId,
        p_viewer_id: viewerId
      })

      if (error) {
        console.error('Error fetching user stories:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserStories:', error)
      return []
    }
  }

  /**
   * Get stories feed
   */
  async getStoriesFeed(viewerId?: string, limit: number = 20): Promise<StoryUser[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_stories_feed', {
        p_viewer_id: viewerId,
        p_limit: limit
      })

      if (error) {
        console.error('Error fetching stories feed:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getStoriesFeed:', error)
      return []
    }
  }

  /**
   * View a story
   */
  async viewStory(storyId: string, viewerId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('view_story', {
        p_story_id: storyId,
        p_viewer_id: viewerId
      })

      if (error) {
        console.error('Error viewing story:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error in viewStory:', error)
      return false
    }
  }

  /**
   * React to a story
   */
  async reactToStory(
    storyId: string, 
    userId: string, 
    reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.rpc('react_to_story', {
        p_story_id: storyId,
        p_user_id: userId,
        p_reaction_type: reactionType
      })

      if (error) {
        console.error('Error reacting to story:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('Error in reactToStory:', error)
      return false
    }
  }

  /**
   * Remove reaction from story
   */
  async removeStoryReaction(storyId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('story_reactions')
        .delete()
        .eq('story_id', storyId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error removing story reaction:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in removeStoryReaction:', error)
      return false
    }
  }

  /**
   * Get story viewers
   */
  async getStoryViewers(storyId: string): Promise<StoryViewer[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_views')
        .select(`
          viewer_id,
          viewed_at,
          viewer:viewer_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('viewed_at', { ascending: false })

      if (error) {
        console.error('Error fetching story viewers:', error)
        return []
      }

      return data?.map(view => ({
        id: view.viewer_id,
        username: view.viewer[0]?.username,
        name: view.viewer[0]?.name,
        avatar_url: view.viewer[0]?.avatar_url,
        viewed_at: view.viewed_at
      })) || []
    } catch (error) {
      console.error('Error in getStoryViewers:', error)
      return []
    }
  }

  /**
   * Get story reactions summary
   */
  async getStoryReactions(storyId: string): Promise<StoryReactionSummary[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_reactions')
        .select(`
          reaction_type,
          user_id,
          created_at,
          user:user_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching story reactions:', error)
        return []
      }

      // Group reactions by type
      const reactionsMap = new Map<string, StoryReactionSummary>()
      
      data?.forEach(reaction => {
        const key = reaction.reaction_type
        if (!reactionsMap.has(key)) {
          reactionsMap.set(key, {
            reaction_type: key,
            count: 0,
            users: []
          })
        }
        
        const summary = reactionsMap.get(key)!
        summary.count++
        summary.users.push({
          id: reaction.user[0]?.id,
          username: reaction.user[0]?.username,
          name: reaction.user[0]?.name,
          avatar_url: reaction.user[0]?.avatar_url,
          viewed_at: reaction.created_at
        })
      })

      return Array.from(reactionsMap.values())
    } catch (error) {
      console.error('Error in getStoryReactions:', error)
      return []
    }
  }

  /**
   * Get story analytics
   */
  async getStoryAnalytics(storyId: string, userId: string): Promise<StoryAnalytics | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_story_analytics', {
        p_story_id: storyId,
        p_user_id: userId
      })

      if (error) {
        console.error('Error fetching story analytics:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getStoryAnalytics:', error)
      return null
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error deleting story:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteStory:', error)
      return false
    }
  }

  /**
   * Add mentions to a story
   */
  private async addStoryMentions(storyId: string, mentionedUserIds: string[]): Promise<void> {
    try {
      const mentions = mentionedUserIds.map(userId => ({
        story_id: storyId,
        mentioned_user_id: userId
      }))

      const { error } = await this.supabase
        .from('story_mentions')
        .insert(mentions)

      if (error) {
        console.error('Error adding story mentions:', error)
      }
    } catch (error) {
      console.error('Error in addStoryMentions:', error)
    }
  }

  /**
   * Get story mentions
   */
  async getStoryMentions(storyId: string): Promise<StoryViewer[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_mentions')
        .select(`
          mentioned_user_id,
          created_at,
          mentioned_user:mentioned_user_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('story_id', storyId)

      if (error) {
        console.error('Error fetching story mentions:', error)
        return []
      }

      return data?.map(mention => ({
        id: mention.mentioned_user[0]?.id,
        username: mention.mentioned_user[0]?.username,
        name: mention.mentioned_user[0]?.name,
        avatar_url: mention.mentioned_user[0]?.avatar_url,
        viewed_at: mention.created_at
      })) || []
    } catch (error) {
      console.error('Error in getStoryMentions:', error)
      return []
    }
  }

  /**
   * Check if user has unviewed stories
   */
  async hasUnviewedStories(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('stories')
        .select('id')
        .neq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .not('id', 'in', `(
          SELECT story_id 
          FROM story_views 
          WHERE viewer_id = '${userId}'
        )`)
        .limit(1)

      if (error) {
        console.error('Error checking unviewed stories:', error)
        return false
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error in hasUnviewedStories:', error)
      return false
    }
  }

  /**
   * Cleanup expired stories
   */
  async cleanupExpiredStories(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_stories')

      if (error) {
        console.error('Error cleaning up expired stories:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Error in cleanupExpiredStories:', error)
      return 0
    }
  }
}

// Singleton instance
export const storyService = new StoryService()
