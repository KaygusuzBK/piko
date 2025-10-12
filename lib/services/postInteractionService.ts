import { InteractionType } from '@/lib/types'
import { interactionRepository } from '@/lib/repositories/interactionRepository'
import { postRepository } from '@/lib/repositories/postRepository'

export class PostInteractionService {
  async toggleInteraction(
    postId: string,
    userId: string,
    type: InteractionType
  ): Promise<boolean> {
    try {
      // Check if interaction exists
      const existing = await interactionRepository.findInteraction(postId, userId, type)

      if (existing) {
        // Remove interaction
        const deleted = await interactionRepository.deleteInteraction(existing.id)
        if (deleted && (type === 'like' || type === 'retweet')) {
          await postRepository.decrementCount(postId, type)
        }
        return false // Interaction removed
      } else {
        // Add interaction
        const created = await interactionRepository.createInteraction(postId, userId, type)
        if (created && (type === 'like' || type === 'retweet')) {
          await postRepository.incrementCount(postId, type)
        }
        return true // Interaction added
      }
    } catch (error) {
      console.error('Error toggling interaction:', error)
      return false
    }
  }

  async getInteractionStatus(postId: string, userId: string) {
    return await interactionRepository.getPostInteractionStatus(postId, userId)
  }

  // Convenience methods
  async toggleLike(postId: string, userId: string): Promise<boolean> {
    return this.toggleInteraction(postId, userId, 'like')
  }

  async toggleRetweet(postId: string, userId: string): Promise<boolean> {
    return this.toggleInteraction(postId, userId, 'retweet')
  }

  async toggleBookmark(postId: string, userId: string): Promise<boolean> {
    return this.toggleInteraction(postId, userId, 'bookmark')
  }
}

// Singleton instance
export const postInteractionService = new PostInteractionService()

