import { createClient } from '@/lib/supabase'
import type { Follow, FollowStatus, FollowUser } from '@/lib/types/follow.types'

/**
 * Follow Repository - Data Access Layer
 * Handles all database operations for follows
 */

/**
 * Follow a user
 */
export async function followUser(followerId: string, followingId: string): Promise<Follow | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error following user:', error)
    return null
  }

  return data
}

/**
 * Unfollow a user
 */
export async function unfollowUser(followerId: string, followingId: string): Promise<boolean> {
  const supabase = createClient()

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)

  if (error) {
    console.error('Error unfollowing user:', error)
    return false
  }

  return true
}

/**
 * Check if a user is following another user
 */
export async function checkFollowStatus(
  currentUserId: string,
  targetUserId: string
): Promise<FollowStatus> {
  const supabase = createClient()

  // Check if current user follows target user
  const { data: followingData } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)
    .single()

  // Check if target user follows current user
  const { data: followedByData } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', targetUserId)
    .eq('following_id', currentUserId)
    .single()

  return {
    isFollowing: !!followingData,
    isFollowedBy: !!followedByData,
  }
}

/**
 * Get followers of a user
 */
export async function getFollowers(userId: string, limit = 50): Promise<FollowUser[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('follows')
    .select(`
      follower:follower_id (
        id,
        name,
        username,
        avatar_url,
        bio,
        followers_count,
        following_count
      )
    `)
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching followers:', error)
    return []
  }

  // Transform the data
  return (data || [])
    .filter(item => item.follower)
    .map(item => {
      const follower = item.follower as any
      return {
        id: follower.id,
        name: follower.name,
        username: follower.username,
        avatar_url: follower.avatar_url,
        bio: follower.bio,
        followers_count: follower.followers_count || 0,
        following_count: follower.following_count || 0,
      }
    })
}

/**
 * Get users that a user is following
 */
export async function getFollowing(userId: string, limit = 50): Promise<FollowUser[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('follows')
    .select(`
      following:following_id (
        id,
        name,
        username,
        avatar_url,
        bio,
        followers_count,
        following_count
      )
    `)
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching following:', error)
    return []
  }

  // Transform the data
  return (data || [])
    .filter(item => item.following)
    .map(item => {
      const following = item.following as any
      return {
        id: following.id,
        name: following.name,
        username: following.username,
        avatar_url: following.avatar_url,
        bio: following.bio,
        followers_count: following.followers_count || 0,
        following_count: following.following_count || 0,
      }
    })
}

/**
 * Get follow suggestions for a user (users not currently followed)
 */
export async function getFollowSuggestions(
  currentUserId: string,
  limit = 5
): Promise<FollowUser[]> {
  const supabase = createClient()

  // Get users that current user is NOT following
  const { data: followingIds } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId)

  const excludedIds = [currentUserId, ...(followingIds || []).map(f => f.following_id)]

  const { data, error } = await supabase
    .from('users')
    .select('id, name, username, avatar_url, bio, followers_count, following_count')
    .not('id', 'in', `(${excludedIds.join(',')})`)
    .order('followers_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching follow suggestions:', error)
    return []
  }

  return (data || []).map(user => ({
    id: user.id,
    name: user.name,
    username: user.username,
    avatar_url: user.avatar_url,
    bio: user.bio,
    followers_count: user.followers_count || 0,
    following_count: user.following_count || 0,
  }))
}

/**
 * Get user IDs that current user is following (for feed filtering)
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', userId)

  if (error) {
    console.error('Error fetching following IDs:', error)
    return []
  }

  return (data || []).map(follow => follow.following_id)
}

