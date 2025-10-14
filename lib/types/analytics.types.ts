export interface UserAnalytics {
  id: string
  user_id: string
  date: string
  profile_views: number
  post_impressions: number
  likes_received: number
  comments_received: number
  retweets_received: number
  followers_gained: number
  followers_lost: number
  posts_created: number
  engagement_rate: number
  created_at: string
  updated_at: string
}

export interface PostAnalytics {
  id: string
  post_id: string
  date: string
  views: number
  likes: number
  comments: number
  retweets: number
  shares: number
  clicks: number
  created_at: string
  updated_at: string
}

export interface HashtagAnalytics {
  id: string
  hashtag_id: string
  date: string
  usage_count: number
  posts_count: number
  engagement_count: number
  trending_score: number
  created_at: string
  updated_at: string
}

export interface AppAnalytics {
  id: string
  date: string
  total_users: number
  active_users: number
  new_users: number
  total_posts: number
  total_likes: number
  total_comments: number
  total_shares: number
  avg_session_duration: number
  bounce_rate: number
  created_at: string
  updated_at: string
}

export interface UserAnalyticsSummary {
  total_profile_views: number
  total_post_impressions: number
  total_likes_received: number
  total_comments_received: number
  total_retweets_received: number
  total_followers_gained: number
  total_followers_lost: number
  total_posts_created: number
  avg_engagement_rate: number
  best_performing_date?: string
  best_performing_engagement_rate: number
}

export interface AnalyticsTrendingHashtag {
  hashtag_id: string
  hashtag_name: string
  usage_count: number
  posts_count: number
  engagement_count: number
  trending_score: number
}

export interface AppAnalyticsSummary {
  total_users: number
  active_users: number
  new_users: number
  total_posts: number
  total_likes: number
  total_comments: number
  total_shares: number
  avg_session_duration: number
  bounce_rate: number
  growth_rate: number
}

export interface AnalyticsChartData {
  date: string
  value: number
  label?: string
}

export interface EngagementMetrics {
  likes: number
  comments: number
  retweets: number
  shares: number
  total: number
}

export interface AnalyticsTimeRange {
  label: string
  days: number
  value: string
}

export interface AnalyticsFilters {
  timeRange: string
  metric: string
  userId?: string
  postId?: string
  hashtagId?: string
}
