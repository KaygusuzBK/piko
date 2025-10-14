/**
 * Analytics Service
 * 
 * Handles user analytics, post analytics, hashtag analytics, and app analytics.
 */

import { createClient } from '@/lib/supabase'
import type {
  UserAnalytics,
  PostAnalytics,
  HashtagAnalytics,
  AppAnalytics,
  UserAnalyticsSummary,
  TrendingHashtag,
  AppAnalyticsSummary,
  AnalyticsChartData,
  AnalyticsFilters
} from '@/lib/types'

export class AnalyticsService {
  private supabase = createClient()

  /**
   * Get user analytics for a specific date range
   */
  async getUserAnalytics(
    userId: string, 
    startDate: string, 
    endDate: string
  ): Promise<UserAnalytics[]> {
    try {
      const { data, error } = await this.supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching user analytics:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserAnalytics:', error)
      return []
    }
  }

  /**
   * Get user analytics summary
   */
  async getUserAnalyticsSummary(userId: string, days: number = 30): Promise<UserAnalyticsSummary | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_analytics_summary', {
        p_user_id: userId,
        p_days: days
      })

      if (error) {
        console.error('Error fetching user analytics summary:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getUserAnalyticsSummary:', error)
      return null
    }
  }

  /**
   * Get post analytics for a specific post
   */
  async getPostAnalytics(
    postId: string, 
    startDate: string, 
    endDate: string
  ): Promise<PostAnalytics[]> {
    try {
      const { data, error } = await this.supabase
        .from('post_analytics')
        .select('*')
        .eq('post_id', postId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching post analytics:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getPostAnalytics:', error)
      return []
    }
  }

  /**
   * Get trending hashtags
   */
  async getTrendingHashtags(days: number = 7, limit: number = 10): Promise<TrendingHashtag[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_trending_hashtags', {
        p_days: days,
        p_limit: limit
      })

      if (error) {
        console.error('Error fetching trending hashtags:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getTrendingHashtags:', error)
      return []
    }
  }

  /**
   * Get app analytics summary
   */
  async getAppAnalyticsSummary(days: number = 30): Promise<AppAnalyticsSummary | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_app_analytics_summary', {
        p_days: days
      })

      if (error) {
        console.error('Error fetching app analytics summary:', error)
        return null
      }

      return data?.[0] || null
    } catch (error) {
      console.error('Error in getAppAnalyticsSummary:', error)
      return null
    }
  }

  /**
   * Get app analytics for a date range
   */
  async getAppAnalytics(
    startDate: string, 
    endDate: string
  ): Promise<AppAnalytics[]> {
    try {
      const { data, error } = await this.supabase
        .from('app_analytics')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) {
        console.error('Error fetching app analytics:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getAppAnalytics:', error)
      return []
    }
  }

  /**
   * Update user analytics
   */
  async updateUserAnalytics(
    userId: string,
    date: string = new Date().toISOString().split('T')[0],
    updates: {
      profile_views?: number
      post_impressions?: number
      likes_received?: number
      comments_received?: number
      retweets_received?: number
      followers_gained?: number
      followers_lost?: number
      posts_created?: number
    }
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('update_user_analytics', {
        p_user_id: userId,
        p_date: date,
        p_profile_views: updates.profile_views || 0,
        p_post_impressions: updates.post_impressions || 0,
        p_likes_received: updates.likes_received || 0,
        p_comments_received: updates.comments_received || 0,
        p_retweets_received: updates.retweets_received || 0,
        p_followers_gained: updates.followers_gained || 0,
        p_followers_lost: updates.followers_lost || 0,
        p_posts_created: updates.posts_created || 0
      })

      if (error) {
        console.error('Error updating user analytics:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updateUserAnalytics:', error)
      return false
    }
  }

  /**
   * Update post analytics
   */
  async updatePostAnalytics(
    postId: string,
    date: string = new Date().toISOString().split('T')[0],
    updates: {
      views?: number
      likes?: number
      comments?: number
      retweets?: number
      shares?: number
      clicks?: number
    }
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('update_post_analytics', {
        p_post_id: postId,
        p_date: date,
        p_views: updates.views || 0,
        p_likes: updates.likes || 0,
        p_comments: updates.comments || 0,
        p_retweets: updates.retweets || 0,
        p_shares: updates.shares || 0,
        p_clicks: updates.clicks || 0
      })

      if (error) {
        console.error('Error updating post analytics:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePostAnalytics:', error)
      return false
    }
  }

  /**
   * Track profile view
   */
  async trackProfileView(viewedUserId: string, viewerUserId?: string): Promise<void> {
    try {
      // Don't track self-views
      if (viewedUserId === viewerUserId) return

      await this.updateUserAnalytics(viewedUserId, undefined, {
        profile_views: 1
      })
    } catch (error) {
      console.error('Error tracking profile view:', error)
    }
  }

  /**
   * Track post impression
   */
  async trackPostImpression(postId: string, userId?: string): Promise<void> {
    try {
      // Update post analytics
      await this.updatePostAnalytics(postId, undefined, {
        views: 1
      })

      // Update user analytics for post author
      if (userId) {
        await this.updateUserAnalytics(userId, undefined, {
          post_impressions: 1
        })
      }
    } catch (error) {
      console.error('Error tracking post impression:', error)
    }
  }

  /**
   * Track engagement (like, comment, retweet)
   */
  async trackEngagement(
    postId: string,
    authorId: string,
    type: 'like' | 'comment' | 'retweet'
  ): Promise<void> {
    try {
      const updates: any = {}
      
      switch (type) {
        case 'like':
          updates.likes_received = 1
          break
        case 'comment':
          updates.comments_received = 1
          break
        case 'retweet':
          updates.retweets_received = 1
          break
      }

      // Update user analytics
      await this.updateUserAnalytics(authorId, undefined, updates)

      // Update post analytics
      const postUpdates: any = {}
      switch (type) {
        case 'like':
          postUpdates.likes = 1
          break
        case 'comment':
          postUpdates.comments = 1
          break
        case 'retweet':
          postUpdates.retweets = 1
          break
      }

      await this.updatePostAnalytics(postId, undefined, postUpdates)
    } catch (error) {
      console.error('Error tracking engagement:', error)
    }
  }

  /**
   * Track follower change
   */
  async trackFollowerChange(
    userId: string,
    type: 'gained' | 'lost'
  ): Promise<void> {
    try {
      const updates: any = {}
      
      if (type === 'gained') {
        updates.followers_gained = 1
      } else {
        updates.followers_lost = 1
      }

      await this.updateUserAnalytics(userId, undefined, updates)
    } catch (error) {
      console.error('Error tracking follower change:', error)
    }
  }

  /**
   * Track post creation
   */
  async trackPostCreation(userId: string): Promise<void> {
    try {
      await this.updateUserAnalytics(userId, undefined, {
        posts_created: 1
      })
    } catch (error) {
      console.error('Error tracking post creation:', error)
    }
  }

  /**
   * Get analytics chart data
   */
  async getAnalyticsChartData(
    filters: AnalyticsFilters
  ): Promise<AnalyticsChartData[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - parseInt(filters.timeRange) * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0]

      let data: any[] = []

      if (filters.userId) {
        data = await this.getUserAnalytics(filters.userId, startDate, endDate)
      } else if (filters.postId) {
        data = await this.getPostAnalytics(filters.postId, startDate, endDate)
      } else {
        data = await this.getAppAnalytics(startDate, endDate)
      }

      // Transform data based on metric
      return data.map(item => ({
        date: item.date,
        value: this.getMetricValue(item, filters.metric),
        label: this.getMetricLabel(filters.metric)
      }))
    } catch (error) {
      console.error('Error getting analytics chart data:', error)
      return []
    }
  }

  /**
   * Get metric value from analytics data
   */
  private getMetricValue(item: any, metric: string): number {
    switch (metric) {
      case 'profile_views':
        return item.profile_views || 0
      case 'post_impressions':
        return item.post_impressions || 0
      case 'likes_received':
        return item.likes_received || 0
      case 'comments_received':
        return item.comments_received || 0
      case 'retweets_received':
        return item.retweets_received || 0
      case 'followers_gained':
        return item.followers_gained || 0
      case 'followers_lost':
        return item.followers_lost || 0
      case 'posts_created':
        return item.posts_created || 0
      case 'engagement_rate':
        return item.engagement_rate || 0
      case 'views':
        return item.views || 0
      case 'likes':
        return item.likes || 0
      case 'comments':
        return item.comments || 0
      case 'retweets':
        return item.retweets || 0
      case 'shares':
        return item.shares || 0
      case 'clicks':
        return item.clicks || 0
      case 'total_users':
        return item.total_users || 0
      case 'active_users':
        return item.active_users || 0
      case 'new_users':
        return item.new_users || 0
      case 'total_posts':
        return item.total_posts || 0
      case 'total_likes':
        return item.total_likes || 0
      case 'total_comments':
        return item.total_comments || 0
      case 'total_shares':
        return item.total_shares || 0
      default:
        return 0
    }
  }

  /**
   * Get metric label
   */
  private getMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      profile_views: 'Profil Görüntülemeleri',
      post_impressions: 'Gönderi Görüntülemeleri',
      likes_received: 'Alınan Beğeniler',
      comments_received: 'Alınan Yorumlar',
      retweets_received: 'Alınan Retweetler',
      followers_gained: 'Kazanılan Takipçiler',
      followers_lost: 'Kaybedilen Takipçiler',
      posts_created: 'Oluşturulan Gönderiler',
      engagement_rate: 'Etkileşim Oranı',
      views: 'Görüntülemeler',
      likes: 'Beğeniler',
      comments: 'Yorumlar',
      retweets: 'Retweetler',
      shares: 'Paylaşımlar',
      clicks: 'Tıklamalar',
      total_users: 'Toplam Kullanıcılar',
      active_users: 'Aktif Kullanıcılar',
      new_users: 'Yeni Kullanıcılar',
      total_posts: 'Toplam Gönderiler',
      total_likes: 'Toplam Beğeniler',
      total_comments: 'Toplam Yorumlar',
      total_shares: 'Toplam Paylaşımlar'
    }

    return labels[metric] || metric
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService()
