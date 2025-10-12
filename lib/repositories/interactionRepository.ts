import { createClient } from '@/lib/supabase'
import { InteractionType, PostInteraction } from '@/lib/types'

export class InteractionRepository {
  private supabase = createClient()

  async findInteraction(
    postId: string,
    userId: string,
    type: InteractionType
  ): Promise<PostInteraction | null> {
    try {
      const { data, error } = await this.supabase
        .from('post_interactions')
        .select('*')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('type', type)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error finding interaction:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error finding interaction:', error)
      return null
    }
  }

  async createInteraction(
    postId: string,
    userId: string,
    type: InteractionType
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('post_interactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          type
        }])

      if (error) {
        console.error('Error creating interaction:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error creating interaction:', error)
      return false
    }
  }

  async deleteInteraction(interactionId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('post_interactions')
        .delete()
        .eq('id', interactionId)

      if (error) {
        console.error('Error deleting interaction:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting interaction:', error)
      return false
    }
  }

  async getUserInteractions(
    userId: string,
    postIds: string[]
  ): Promise<PostInteraction[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_interactions')
        .select('*')
        .eq('user_id', userId)
        .in('post_id', postIds)

      if (error) {
        console.error('Error fetching user interactions:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user interactions:', error)
      return []
    }
  }

  async getPostInteractionStatus(
    postId: string,
    userId: string
  ): Promise<{ isLiked: boolean; isRetweeted: boolean; isBookmarked: boolean }> {
    try {
      const { data, error } = await this.supabase
        .from('post_interactions')
        .select('type')
        .eq('post_id', postId)
        .eq('user_id', userId)

      if (error) {
        console.error('Error fetching interaction status:', error)
        return { isLiked: false, isRetweeted: false, isBookmarked: false }
      }

      const types = data?.map(i => i.type) || []

      return {
        isLiked: types.includes('like'),
        isRetweeted: types.includes('retweet'),
        isBookmarked: types.includes('bookmark')
      }
    } catch (error) {
      console.error('Error fetching interaction status:', error)
      return { isLiked: false, isRetweeted: false, isBookmarked: false }
    }
  }
}

// Singleton instance
export const interactionRepository = new InteractionRepository()

