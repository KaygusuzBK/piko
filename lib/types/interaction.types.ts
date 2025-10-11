export type InteractionType = 'like' | 'retweet' | 'bookmark'

export interface PostInteraction {
  id: string
  user_id: string
  post_id: string
  type: InteractionType
  created_at: string
}

export interface InteractionCountUpdate {
  postId: string
  type: InteractionType
  increment: boolean
}

