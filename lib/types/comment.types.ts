export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface CommentAuthor {
  id: string
  username: string
  avatar_url?: string
  name?: string
}

export interface CommentWithAuthor extends Comment {
  author: CommentAuthor
}

export interface CreateCommentData {
  post_id: string
  author_id: string
  content: string
}

