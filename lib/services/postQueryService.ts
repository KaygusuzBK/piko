import { PostWithAuthor, PostQueryFilters, InteractionStatus } from '@/lib/types'
import { postRepository } from '@/lib/repositories/postRepository'

export class PostQueryService {
  private processInteractionStatus(
    interactions: Array<{ type: string; user_id: string }> | undefined,
    viewerUserId?: string
  ): InteractionStatus {
    if (!viewerUserId || !interactions) {
      return { isLiked: false, isRetweeted: false, isBookmarked: false }
    }

    const userInteractions = interactions.filter(i => i.user_id === viewerUserId)

    return {
      isLiked: userInteractions.some(i => i.type === 'like'),
      isRetweeted: userInteractions.some(i => i.type === 'retweet'),
      isBookmarked: userInteractions.some(i => i.type === 'bookmark')
    }
  }

  async fetchPostsWithInteractions(
    filters: PostQueryFilters,
    viewerUserId?: string
  ): Promise<PostWithAuthor[]> {
    try {
      const rawPosts = await postRepository.fetchPosts(filters)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rawPosts.map((post: Record<string, any>) => {
        const interactionStatus = this.processInteractionStatus(
          post.user_interactions,
          viewerUserId
        )

        // Clean up the response
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { user_interactions, post_interactions, ...cleanPost } = post

        return {
          ...cleanPost,
          user_interaction_status: interactionStatus
        } as PostWithAuthor
      })
    } catch (error) {
      console.error('Error fetching posts with interactions:', error)
      return []
    }
  }

  // Convenience methods for common queries
  async getFeedPosts(limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
    return this.fetchPostsWithInteractions({ limit, offset }, viewerUserId)
  }

  async getUserPosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
    return this.fetchPostsWithInteractions({ authorId: userId, limit, offset }, viewerUserId)
  }

  async getUserLikedPosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
    return this.fetchPostsWithInteractions({ likedByUserId: userId, limit, offset }, viewerUserId)
  }

  async getUserFavoritePosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
    return this.fetchPostsWithInteractions({ bookmarkedByUserId: userId, limit, offset }, viewerUserId)
  }

  async getUserMediaPosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
    return this.fetchPostsWithInteractions({ authorId: userId, type: 'media', limit, offset }, viewerUserId)
  }

  async getPostById(postId: string, viewerUserId?: string): Promise<PostWithAuthor | null> {
    try {
      const posts = await postRepository.fetchPostById(postId)
      if (!posts || posts.length === 0) {
        return null
      }

      const post = posts[0]
      const interactionStatus = this.processInteractionStatus(
        post.user_interactions,
        viewerUserId
      )

      // Clean up the response
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { user_interactions, post_interactions, ...cleanPost } = post

      return {
        ...cleanPost,
        user_interaction_status: interactionStatus
      } as PostWithAuthor
    } catch (error) {
      console.error('Error fetching post by id:', error)
      return null
    }
  }
}

// Singleton instance
export const postQueryService = new PostQueryService()

