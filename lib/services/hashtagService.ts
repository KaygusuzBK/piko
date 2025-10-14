/**
 * Hashtag Service
 * 
 * Business logic layer for hashtags.
 * Handles hashtag creation, linking, and management.
 */

import { hashtagRepository } from '@/lib/repositories/hashtagRepository'
import type {
  Hashtag,
  PostHashtag,
  TrendingHashtag,
  CreateHashtagData,
  HashtagWithPosts
} from '@/lib/types'

export class HashtagService {
  private hashtagRepo = hashtagRepository

  /**
   * Process hashtags in post content and link them to post
   */
  async processPostHashtags(postId: string, content: string): Promise<boolean> {
    try {
      // Extract hashtags from content
      const hashtagNames = await this.hashtagRepo.extractHashtags(content)
      
      if (hashtagNames.length === 0) {
        return true // No hashtags to process
      }

      // Link hashtags to post
      return await this.hashtagRepo.linkHashtagsToPost(postId, hashtagNames)
    } catch (error) {
      console.error('Error in processPostHashtags:', error)
      return false
    }
  }

  /**
   * Get hashtag by name
   */
  async getHashtagByName(name: string): Promise<Hashtag | null> {
    try {
      return await this.hashtagRepo.getHashtagByName(name)
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
      return await this.hashtagRepo.getHashtagById(id)
    } catch (error) {
      console.error('Error in getHashtagById:', error)
      return null
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(limit: number = 10): Promise<Hashtag[]> {
    try {
      const trending = await this.hashtagRepo.getTrendingHashtags(limit)
      // Convert TrendingHashtag[] to Hashtag[]
      return trending.map((t: TrendingHashtag) => ({
        id: t.id,
        name: t.name,
        usage_count: t.usage_count,
        trending_score: t.trending_score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error in getTrendingHashtags:', error)
      return []
    }
  }

  /**
   * Search hashtags
   */
  async searchHashtags(query: string, limit: number = 20): Promise<Hashtag[]> {
    try {
      if (!query || query.trim().length < 2) {
        return []
      }

      return await this.hashtagRepo.searchHashtags(query.trim(), limit)
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
      return await this.hashtagRepo.getPostsForHashtag(hashtagName, limit, offset)
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
      return await this.hashtagRepo.getHashtagsForPost(postId)
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
      return await this.hashtagRepo.getHashtagStats(hashtagName)
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
      // Validate hashtag name
      if (!hashtagData.name || hashtagData.name.trim().length === 0) {
        throw new Error('Hashtag name is required')
      }

      const cleanName = hashtagData.name.trim().toLowerCase()
      
      // Validate hashtag format (alphanumeric and underscores only)
      if (!/^[a-z0-9_]+$/.test(cleanName)) {
        throw new Error('Hashtag can only contain letters, numbers, and underscores')
      }

      if (cleanName.length > 50) {
        throw new Error('Hashtag name cannot exceed 50 characters')
      }

      return await this.hashtagRepo.createHashtag({
        name: cleanName
      })
    } catch (error) {
      console.error('Error in createHashtag:', error)
      throw error
    }
  }

  /**
   * Extract hashtags from text (utility function)
   */
  async extractHashtags(text: string): Promise<string[]> {
    try {
      return await this.hashtagRepo.extractHashtags(text)
    } catch (error) {
      console.error('Error in extractHashtags:', error)
      return []
    }
  }

  /**
   * Get popular hashtags (most used)
   */
  async getPopularHashtags(limit: number = 20): Promise<Hashtag[]> {
    try {
      const { data, error } = await this.hashtagRepo.supabaseClient
        .from('hashtags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching popular hashtags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPopularHashtags:', error)
      return []
    }
  }

  /**
   * Get recent hashtags
   */
  async getRecentHashtags(limit: number = 20): Promise<Hashtag[]> {
    try {
      const { data, error } = await this.hashtagRepo.supabaseClient
        .from('hashtags')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent hashtags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getRecentHashtags:', error)
      return []
    }
  }

  /**
   * Update hashtag usage count
   */
  async updateHashtagUsage(hashtagId: string, increment: number = 1): Promise<boolean> {
    try {
      return await this.hashtagRepo.updateHashtagUsage(hashtagId, increment)
    } catch (error) {
      console.error('Error in updateHashtagUsage:', error)
      return false
    }
  }

  /**
   * Delete hashtag
   */
  async deleteHashtag(hashtagId: string): Promise<boolean> {
    try {
      return await this.hashtagRepo.deleteHashtag(hashtagId)
    } catch (error) {
      console.error('Error in deleteHashtag:', error)
      return false
    }
  }

  /**
   * Get hashtag suggestions based on partial input
   */
  async getHashtagSuggestions(partialInput: string, limit: number = 10): Promise<Hashtag[]> {
    try {
      if (!partialInput || partialInput.trim().length < 1) {
        return await this.getTrendingHashtags(limit)
      }

      const cleanInput = partialInput.trim().toLowerCase()
      
      // If input starts with #, remove it
      const searchTerm = cleanInput.startsWith('#') ? cleanInput.slice(1) : cleanInput
      
      return await this.searchHashtags(searchTerm, limit)
    } catch (error) {
      console.error('Error in getHashtagSuggestions:', error)
      return []
    }
  }
}

// Singleton instance
export const hashtagService = new HashtagService()
