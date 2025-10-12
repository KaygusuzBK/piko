import {
  followUser as followUserRepo,
  unfollowUser as unfollowUserRepo,
  checkFollowStatus as checkFollowStatusRepo,
  getFollowers as getFollowersRepo,
  getFollowing as getFollowingRepo,
  getFollowSuggestions as getFollowSuggestionsRepo,
  getFollowingIds as getFollowingIdsRepo,
} from '@/lib/repositories/followRepository'
import type { FollowStatus, FollowUser } from '@/lib/types/follow.types'

/**
 * Follow Service - Business Logic Layer
 * Handles follow-related business logic and validation
 */

/**
 * Toggle follow status (follow or unfollow)
 */
export async function toggleFollow(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean; isFollowing: boolean }> {
  try {
    // Check current follow status
    const status = await checkFollowStatusRepo(currentUserId, targetUserId)

    if (status.isFollowing) {
      // Unfollow
      const success = await unfollowUserRepo(currentUserId, targetUserId)
      return { success, isFollowing: false }
    } else {
      // Follow
      const result = await followUserRepo(currentUserId, targetUserId)
      return { success: !!result, isFollowing: true }
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    return { success: false, isFollowing: false }
  }
}

/**
 * Follow a user
 */
export async function followUser(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    if (currentUserId === targetUserId) {
      console.error('Cannot follow yourself')
      return false
    }

    const result = await followUserRepo(currentUserId, targetUserId)
    return !!result
  } catch (error) {
    console.error('Error following user:', error)
    return false
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    return await unfollowUserRepo(currentUserId, targetUserId)
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return false
  }
}

/**
 * Check follow status between two users
 */
export async function checkFollowStatus(
  currentUserId: string,
  targetUserId: string
): Promise<FollowStatus> {
  try {
    return await checkFollowStatusRepo(currentUserId, targetUserId)
  } catch (error) {
    console.error('Error checking follow status:', error)
    return { isFollowing: false, isFollowedBy: false }
  }
}

/**
 * Get followers of a user with follow status
 */
export async function getFollowers(
  userId: string,
  currentUserId?: string,
  limit = 50
): Promise<FollowUser[]> {
  try {
    const followers = await getFollowersRepo(userId, limit)

    // If current user is provided, check which followers the current user follows
    if (currentUserId && currentUserId !== userId) {
      const followStatuses = await Promise.all(
        followers.map(async (follower) => {
          const status = await checkFollowStatusRepo(currentUserId, follower.id)
          return { ...follower, isFollowing: status.isFollowing }
        })
      )
      return followStatuses
    }

    return followers
  } catch (error) {
    console.error('Error getting followers:', error)
    return []
  }
}

/**
 * Get users that a user is following with follow status
 */
export async function getFollowing(
  userId: string,
  currentUserId?: string,
  limit = 50
): Promise<FollowUser[]> {
  try {
    const following = await getFollowingRepo(userId, limit)

    // If current user is provided, check which users the current user follows
    if (currentUserId && currentUserId !== userId) {
      const followStatuses = await Promise.all(
        following.map(async (user) => {
          const status = await checkFollowStatusRepo(currentUserId, user.id)
          return { ...user, isFollowing: status.isFollowing }
        })
      )
      return followStatuses
    }

    return following
  } catch (error) {
    console.error('Error getting following:', error)
    return []
  }
}

/**
 * Get follow suggestions for a user
 */
export async function getFollowSuggestions(
  currentUserId: string,
  limit = 5
): Promise<FollowUser[]> {
  try {
    return await getFollowSuggestionsRepo(currentUserId, limit)
  } catch (error) {
    console.error('Error getting follow suggestions:', error)
    return []
  }
}

/**
 * Get following IDs (for feed filtering)
 */
export async function getFollowingIds(userId: string): Promise<string[]> {
  try {
    return await getFollowingIdsRepo(userId)
  } catch (error) {
    console.error('Error getting following IDs:', error)
    return []
  }
}

