import { Comment, CommentWithAuthor, CreateCommentData } from '@/lib/types'
import { commentRepository } from '@/lib/repositories/commentRepository'
import { userRepository } from '@/lib/repositories/userRepository'

export class CommentService {
  async createComment(data: CreateCommentData): Promise<Comment | null> {
    try {
      // Ensure profile exists
      const profileExists = await userRepository.ensureProfile(data.author_id)
      if (!profileExists) {
        console.error('Failed to ensure profile exists')
        return null
      }

      return await commentRepository.createComment(data)
    } catch (error) {
      console.error('Error in createComment service:', error)
      return null
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    return await commentRepository.deleteComment(commentId, userId)
  }

  async getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
    try {
      const rawComments = await commentRepository.fetchCommentsByPostId(postId)
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return rawComments.map((comment: Record<string, any>) => {
        return {
          id: comment.id,
          post_id: comment.post_id,
          author_id: comment.author_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          author: comment.author
        } as CommentWithAuthor
      })
    } catch (error) {
      console.error('Error fetching comments with author:', error)
      return []
    }
  }
}

// Singleton instance
export const commentService = new CommentService()

