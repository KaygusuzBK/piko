// Comment operations
export * from './types/comment.types'

import { commentService } from './services/commentService'
import { Comment, CommentWithAuthor, CreateCommentData } from './types'

export async function createComment(data: CreateCommentData): Promise<Comment | null> {
  return commentService.createComment(data)
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  return commentService.deleteComment(commentId, userId)
}

export async function getCommentsByPostId(postId: string): Promise<CommentWithAuthor[]> {
  return commentService.getCommentsByPostId(postId)
}

