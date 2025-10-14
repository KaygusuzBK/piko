/**
 * Hashtag Repository
 * 
 * Data access layer for hashtags.
 * Handles all database operations related to hashtags.
 */

import { createClient } from '@/lib/supabase'
import type { 
  Hashtag,
  PostHashtag,
  TrendingHashtag,
  CreateHashtagData,
  HashtagWithPosts
} from '@/lib/types'

export class HashtagRepository {
  private supabase = createClient()
  
  // Expose supabase for service layer
  get supabaseClient() {
    return this.supabase
  }

  /**
   * Extract hashtags from text content
   */
  async extractHashtags(text: string): Promise<string[]> {
    try {
      const { data, error } = await this.supabase.rpc('extract_hashtags', {
        text_content: text
      })

      if (error) {
        console.error('Error extracting hashtags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in extractHashtags:', error)
      return []
    }
  }

  /**
   * Link hashtags to a post
   */
  async linkHashtagsToPost(postId: string, hashtagNames: string[]): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('link_hashtags_to_post', {
        post_id: postId,
        hashtag_names: hashtagNames
      })

      if (error) {
        console.error('Error linking hashtags to post:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in linkHashtagsToPost:', error)
      return false
    }
  }

  /**
   * Get hashtag by name
   */
  async getHashtagByName(name: string): Promise<Hashtag | null> {
    try {
      const { data, error } = await this.supabase
        .from('hashtags')
        .select('*')
        .eq('name', name.toLowerCase())
        .single()

      if (error) {
        console.error('Error fetching hashtag:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getHashtagByName:', error)
      return null
    }
  }

  /**
   * Get hashtag by ID
   */
  async getHashtagById(id: string): Promise<Hashtag | null> {
    try {
      const { data, error } = await this.supabase
        .from('hashtags')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching hashtag by ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getHashtagById:', error)
      return null
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 10): Promise<TrendingHashtag[]> {
    try {
      // Direct query instead of RPC function
      const { data, error } = await this.supabase
        .from('hashtags')
        .select('id, name, usage_count')
        .gt('usage_count', 0)
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching trending hashtags:', error)
        // Return empty array instead of throwing
        return []
      }

      // If no data, return empty array
      if (!data || data.length === 0) {
        console.log('No trending hashtags found')
        return []
      }

      // Transform to TrendingHashtag format
      return data.map(hashtag => ({
        id: hashtag.id,
        name: hashtag.name,
        usage_count: hashtag.usage_count,
        trending_score: hashtag.usage_count // Use usage_count as trending_score
      }))
    } catch (error) {
      console.error('Error in getTrendingHashtags:', error)
      return []
    }
  }

  /**
   * Search hashtags by name
   */
  async searchHashtags(query: string, limit: number = 20): Promise<Hashtag[]> {
    try {
      const { data, error } = await this.supabase
        .from('hashtags')
        .select('*')
        .ilike('name', `%${query.toLowerCase()}%`)
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error searching hashtags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in searchHashtags:', error)
      return []
    }
  }

  /**
   * Get posts for a hashtag
   */
  async getPostsForHashtag(
    hashtagName: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_hashtags')
        .select(`
          *,
          post:posts!post_hashtags_post_id_fkey (
            *,
            author:users!posts_author_id_fkey (
              id,
              username,
              name,
              avatar_url
            )
          )
        `)
        .eq('hashtag.name', hashtagName.toLowerCase())
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching posts for hashtag:', error)
        return []
      }

      return (data || []).map(item => item.post).filter(Boolean)
    } catch (error) {
      console.error('Error in getPostsForHashtag:', error)
      return []
    }
  }

  /**
   * Get hashtags for a post
   */
  async getHashtagsForPost(postId: string): Promise<Hashtag[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_hashtags')
        .select(`
          *,
          hashtag:hashtags!post_hashtags_hashtag_id_fkey (*)
        `)
        .eq('post_id', postId)

      if (error) {
        console.error('Error fetching hashtags for post:', error)
        return []
      }

      return (data || []).map(item => item.hashtag).filter(Boolean)
    } catch (error) {
      console.error('Error in getHashtagsForPost:', error)
      return []
    }
  }

  /**
   * Get hashtag statistics
   */
  async getHashtagStats(hashtagName: string): Promise<HashtagWithPosts | null> {
    try {
      const hashtag = await this.getHashtagByName(hashtagName)
      if (!hashtag) return null

      // Get posts count
      const { count, error } = await this.supabase
        .from('post_hashtags')
        .select('*', { count: 'exact', head: true })
        .eq('hashtag_id', hashtag.id)

      if (error) {
        console.error('Error getting hashtag stats:', error)
        return hashtag
      }

      return {
        ...hashtag,
        posts_count: count || 0
      }
    } catch (error) {
      console.error('Error in getHashtagStats:', error)
      return null
    }
  }

  /**
   * Create a new hashtag
   */
  async createHashtag(hashtagData: CreateHashtagData): Promise<Hashtag | null> {
    try {
      const { data, error } = await this.supabase
        .from('hashtags')
        .insert({
          name: hashtagData.name.toLowerCase()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating hashtag:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createHashtag:', error)
      return null
    }
  }

  /**
   * Update hashtag usage count
   */
  async updateHashtagUsage(hashtagId: string, increment: number = 1): Promise<boolean> {
    try {
      // Get current usage count
      const { data: currentData, error: fetchError } = await this.supabase
        .from('hashtags')
        .select('usage_count')
        .eq('id', hashtagId)
        .single()

      if (fetchError) {
        console.error('Error fetching current usage count:', fetchError)
        return false
      }

      // Update with new count
      const { error } = await this.supabase
        .from('hashtags')
        .update({
          usage_count: (currentData?.usage_count || 0) + increment,
          updated_at: new Date().toISOString()
        })
        .eq('id', hashtagId)

      if (error) {
        console.error('Error updating hashtag usage:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateHashtagUsage:', error)
      return false
    }
  }

  /**
   * Delete hashtag (only if no posts are using it)
   */
  async deleteHashtag(hashtagId: string): Promise<boolean> {
    try {
      // Check if hashtag is being used
      const { count, error: countError } = await this.supabase
        .from('post_hashtags')
        .select('*', { count: 'exact', head: true })
        .eq('hashtag_id', hashtagId)

      if (countError) {
        console.error('Error checking hashtag usage:', countError)
        return false
      }

      if (count && count > 0) {
        console.error('Cannot delete hashtag that is being used')
        return false
      }

      const { error } = await this.supabase
        .from('hashtags')
        .delete()
        .eq('id', hashtagId)

      if (error) {
        console.error('Error deleting hashtag:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteHashtag:', error)
      return false
    }
  }
}

// Singleton instance
export const hashtagRepository = new HashtagRepository()
