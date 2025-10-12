import { createClient } from '@/lib/supabase'
import { Post, CreatePostData, PostQueryFilters } from '@/lib/types'
import { InteractionType } from '@/lib/types'

export class PostRepository {
  private supabase = createClient()

  async createPost(data: CreatePostData): Promise<Post | null> {
    try {
      const { data: post, error } = await this.supabase
        .from('posts')
        .insert([{
          content: data.content,
          author_id: data.author_id,
          image_urls: data.image_urls || [],
          type: data.type || 'text',
          likes_count: 0,
          comments_count: 0,
          retweets_count: 0
        }])
        .select()
        .single()

      if (error) {
        console.error('Error creating post:', error)
        return null
      }

      return post
    } catch (error) {
      console.error('Error creating post:', error)
      return null
    }
  }

  async deletePost(postId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', userId)

      if (error) {
        console.error('Error deleting post:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error deleting post:', error)
      return false
    }
  }

  async fetchPostById(postId: string) {
    try {
      const { data, error } = await this.supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey (
            id,
            username,
            avatar_url,
            name
          ),
          user_interactions:post_interactions!left (
            type,
            user_id
          )
        `)
        .eq('id', postId)

      if (error) {
        console.error('Error fetching post by id:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching post by id:', error)
      return []
    }
  }

  async fetchPosts(filters: PostQueryFilters) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = this.supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey (
            id,
            username,
            avatar_url
          ),
          user_interactions:post_interactions!left (
            type,
            user_id
          )
        `)

      // Apply filters
      if (filters.authorId) {
        query = query.eq('author_id', filters.authorId)
      }

      if (filters.type) {
        query = query.eq('type', filters.type)
      }

      // For liked/bookmarked posts, we need inner join
      if (filters.likedByUserId) {
        query = query
          .select(`
            *,
            author:users!posts_author_id_fkey (
              id,
              username,
              avatar_url
            ),
            user_interactions:post_interactions!left (
              type,
              user_id
            ),
            post_interactions!inner (
              user_id,
              type
            )
          `)
          .eq('post_interactions.user_id', filters.likedByUserId)
          .eq('post_interactions.type', 'like')
      }

      if (filters.bookmarkedByUserId) {
        query = query
          .select(`
            *,
            author:users!posts_author_id_fkey (
              id,
              username,
              avatar_url
            ),
            user_interactions:post_interactions!left (
              type,
              user_id
            ),
            post_interactions!inner (
              user_id,
              type
            )
          `)
          .eq('post_interactions.user_id', filters.bookmarkedByUserId)
          .eq('post_interactions.type', 'bookmark')
      }

      // For personalized feed - posts from users that current user follows
      if (filters.followingUserId) {
        query = query
          .select(`
            *,
            author:users!posts_author_id_fkey (
              id,
              username,
              avatar_url
            ),
            user_interactions:post_interactions!left (
              type,
              user_id
            ),
            follows!inner (
              follower_id
            )
          `)
          .eq('follows.follower_id', filters.followingUserId)
      }

      query = query.order('created_at', { ascending: false })

      if (filters.limit !== undefined) {
        const offset = filters.offset || 0
        query = query.range(offset, offset + filters.limit - 1)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching posts:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error fetching posts:', error)
      return []
    }
  }

  async incrementCount(postId: string, type: InteractionType): Promise<void> {
    const rpcName = `increment_${type === 'like' ? 'likes' : 'retweets'}_count`
    await this.supabase.rpc(rpcName, { post_id: postId })
  }

  async decrementCount(postId: string, type: InteractionType): Promise<void> {
    const rpcName = `decrement_${type === 'like' ? 'likes' : 'retweets'}_count`
    await this.supabase.rpc(rpcName, { post_id: postId })
  }
}

// Singleton instance
export const postRepository = new PostRepository()

