import { createClient } from '@/lib/supabase'
import { Comment, CreateCommentData } from '@/lib/types'

export class CommentRepository {
  private supabase = createClient()

  async createComment(data: CreateCommentData): Promise<Comment | null> {
    try {
      const { data: comment, error } = await this.supabase
        .from('comments')
        .insert([{
          post_id: data.post_id,
          author_id: data.author_id,
          content: data.content
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating comment:', error)
        return null
      }

      // Increment comments count
      await this.supabase.rpc('increment_comments_count', { post_id: data.post_id })

      return comment
    } catch (error) {
      console.error('Error creating comment:', error)
      return null
    }
  }

  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      // First get the comment to get post_id
      const { data: comment } = await this.supabase
        .from('comments')
        .select('post_id')
        .eq('id', commentId)
        .eq('author_id', userId)
        .single()

      if (!comment) {
        return false
      }

      const { error } = await this.supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', userId)

      if (error) {
        console.error('Error deleting comment:', error)
        return false
      }

      // Decrement comments count
      await this.supabase.rpc('decrement_comments_count', { post_id: comment.post_id })

      return true
    } catch (error) {
      console.error('Error deleting comment:', error)
      return false
    }
  }

  async fetchCommentsByPostId(postId: string) {
    try {
      const { data, error } = await this.supabase
        .from('comments')
        .select(`
          *,
          author:users!comments_author_id_fkey (
            id,
            username,
            avatar_url,
            name
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching comments:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  }
}

// Singleton instance
export const commentRepository = new CommentRepository()

