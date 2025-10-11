import { Post, CreatePostData } from '@/lib/types'
import { postRepository } from '@/lib/repositories/postRepository'
import { userRepository } from '@/lib/repositories/userRepository'

export class PostService {
  async createPost(data: CreatePostData): Promise<Post | null> {
    try {
      // Ensure profile exists
      const profileExists = await userRepository.ensureProfile(data.author_id)
      if (!profileExists) {
        console.error('Failed to ensure profile exists')
        return null
      }

      return await postRepository.createPost(data)
    } catch (error) {
      console.error('Error in createPost service:', error)
      return null
    }
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    return await postRepository.deletePost(postId, userId)
  }
}

// Singleton instance
export const postService = new PostService()

