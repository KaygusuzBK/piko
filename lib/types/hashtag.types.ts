export interface Hashtag {
  id: string
  name: string
  usage_count: number
  trending_score: number
  created_at: string
  updated_at: string
}

export interface PostHashtag {
  post_id: string
  hashtag_id: string
  created_at: string
  hashtag?: Hashtag
}

export interface TrendingHashtag {
  id: string
  name: string
  usage_count: number
  trending_score: number
}

export interface CreateHashtagData {
  name: string
}

export interface HashtagWithPosts extends Hashtag {
  posts_count?: number
  recent_posts?: any[] // PostWithAuthor[]
}
