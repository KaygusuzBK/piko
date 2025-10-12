import { PostCard } from '@/components/PostCard'
import { PostWithAuthor } from '@/lib/types'

interface ProfilePostsProps {
  posts: PostWithAuthor[]
  loading: boolean
  emptyMessage: string
  currentUserId?: string
  onLike: (postId: string) => Promise<void>
  onRetweet: (postId: string) => Promise<void>
  onBookmark: (postId: string) => Promise<void>
  onComment: (postId: string) => void
  onDelete: (postId: string) => void
}

export function ProfilePosts({
  posts,
  loading,
  emptyMessage,
  currentUserId,
  onLike,
  onRetweet,
  onBookmark,
  onComment,
  onDelete
}: ProfilePostsProps) {
  if (loading) {
    return <div className="p-4 text-sm text-muted-foreground">Yükleniyor...</div>
  }

  if (posts.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground text-center">{emptyMessage}</div>
  }

  return (
    <>
      {posts.map((post) => (
        <div key={post.id} className="p-0">
          <PostCard
            post={post}
            canDelete={currentUserId === post.author_id}
            onDelete={onDelete}
            onLike={onLike}
            onRetweet={onRetweet}
            onBookmark={onBookmark}
            onComment={onComment}
          />
        </div>
      ))}
    </>
  )
}

