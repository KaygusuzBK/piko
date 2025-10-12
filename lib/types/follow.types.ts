// Follow system types

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface FollowStatus {
  isFollowing: boolean
  isFollowedBy: boolean
}

export interface FollowStats {
  followers_count: number
  following_count: number
}

export interface CreateFollowData {
  follower_id: string
  following_id: string
}

export interface FollowUser {
  id: string
  name: string | null
  username: string | null
  avatar_url: string | null
  bio: string | null
  followers_count: number
  following_count: number
  isFollowing?: boolean
}

