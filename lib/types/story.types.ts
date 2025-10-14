export interface Story {
  id: string
  user_id: string
  media_url: string
  media_type: 'image' | 'video'
  duration: number
  expires_at: string
  created_at: string
  updated_at: string
}

export interface StoryWithStats extends Story {
  view_count: number
  reaction_count: number
  has_viewed: boolean
  user_reaction?: string
}

export interface StoryView {
  id: string
  story_id: string
  viewer_id: string
  viewed_at: string
}

export interface StoryReaction {
  id: string
  story_id: string
  user_id: string
  reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
  created_at: string
}

export interface StoryMention {
  id: string
  story_id: string
  mentioned_user_id: string
  created_at: string
}

export interface StoryUser {
  user_id: string
  username: string
  name: string
  avatar_url?: string
  stories_count: number
  latest_story_id: string
  latest_story_created_at: string
  has_viewed_all: boolean
}

export interface StoryAnalytics {
  view_count: number
  reaction_count: number
  unique_viewers: number
  top_reaction?: string
  views_by_hour: Record<string, number>
}

export interface CreateStoryData {
  media_url: string
  media_type: 'image' | 'video'
  duration?: number
  expires_hours?: number
  mentions?: string[] // Array of user IDs
}

export interface StoryViewer {
  id: string
  username: string
  name: string
  avatar_url?: string
  viewed_at: string
}

export interface StoryReactionSummary {
  reaction_type: string
  count: number
  users: StoryViewer[]
}
