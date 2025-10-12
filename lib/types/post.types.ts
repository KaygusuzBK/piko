export interface Post {
  id: string
  content: string
  author_id: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  retweets_count: number
}

export interface PostAuthor {
  id: string
  username: string
  avatar_url?: string
}

export interface PostWithAuthor extends Post {
  author: PostAuthor
  user_interaction_status?: InteractionStatus
}

export interface InteractionStatus {
  isLiked: boolean
  isRetweeted: boolean
  isBookmarked: boolean
}

export interface CreatePostData {
  content: string
  author_id: string
}

export interface PostQueryFilters {
  authorId?: string
  likedByUserId?: string
  bookmarkedByUserId?: string
  limit?: number
  offset?: number
}

