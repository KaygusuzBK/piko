'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { PostActions } from '@/components/post/PostActions'
import { CommentInput } from '@/components/CommentInput'
import { CommentCard } from '@/components/CommentCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getPostById, toggleLike, toggleRetweet, togglePostBookmark } from '@/lib/posts'
import { createComment, getCommentsByPostId, deleteComment } from '@/lib/comments'
import { useAuthStore } from '@/stores/authStore'
import { PostWithAuthor, CommentWithAuthor } from '@/lib/types'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const postId = params.id as string

  const [post, setPost] = useState<PostWithAuthor | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPost = useCallback(async () => {
    if (!postId) return

    setLoading(true)
    setError(null)
    try {
      const fetchedPost = await getPostById(postId, user?.id)
      if (!fetchedPost) {
        setError('Gönderi bulunamadı')
      } else {
        setPost(fetchedPost)
      }
    } catch (err) {
      console.error('Error loading post:', err)
      setError('Gönderi yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }, [postId, user?.id])

  const loadComments = useCallback(async () => {
    if (!postId) return

    setLoadingComments(true)
    try {
      const fetchedComments = await getCommentsByPostId(postId)
      setComments(fetchedComments)
    } catch (err) {
      console.error('Error loading comments:', err)
    } finally {
      setLoadingComments(false)
    }
  }, [postId])

  useEffect(() => {
    loadPost()
    loadComments()
  }, [loadPost, loadComments])

  const handleCreateComment = useCallback(async (content: string) => {
    if (!user?.id || !postId) return

    try {
      const newComment = await createComment({
        post_id: postId,
        author_id: user.id,
        content
      })

      if (newComment) {
        // Reload comments to get the full comment with author
        await loadComments()
        
        // Update post comments count
        setPost(prev => {
          if (!prev) return prev
          return {
            ...prev,
            comments_count: prev.comments_count + 1
          }
        })
      }
    } catch (error) {
      console.error('Error creating comment:', error)
      throw error
    }
  }, [user?.id, postId, loadComments])

  const handleDeleteComment = useCallback(async (commentId: string) => {
    if (!user?.id) return

    try {
      const success = await deleteComment(commentId, user.id)
      if (success) {
        setComments(prev => prev.filter(c => c.id !== commentId))
        
        // Update post comments count
        setPost(prev => {
          if (!prev) return prev
          return {
            ...prev,
            comments_count: Math.max(0, prev.comments_count - 1)
          }
        })
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
      throw error
    }
  }, [user?.id])

  const handleLike = useCallback(async (postId: string) => {
    if (!user?.id || !post) return

    const isCurrentlyLiked = post.user_interaction_status?.isLiked || false

    // Optimistic update
    setPost(prev => {
      if (!prev) return prev
      return {
        ...prev,
        likes_count: isCurrentlyLiked ? prev.likes_count - 1 : prev.likes_count + 1,
        user_interaction_status: {
          isLiked: !isCurrentlyLiked,
          isRetweeted: prev.user_interaction_status?.isRetweeted || false,
          isBookmarked: prev.user_interaction_status?.isBookmarked || false
        }
      }
    })

    try {
      await toggleLike(postId, user.id)
    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert on error
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          likes_count: isCurrentlyLiked ? prev.likes_count + 1 : prev.likes_count - 1,
          user_interaction_status: {
            isLiked: isCurrentlyLiked,
            isRetweeted: prev.user_interaction_status?.isRetweeted || false,
            isBookmarked: prev.user_interaction_status?.isBookmarked || false
          }
        }
      })
    }
  }, [user?.id, post])

  const handleRetweet = useCallback(async (postId: string) => {
    if (!user?.id || !post) return

    const isCurrentlyRetweeted = post.user_interaction_status?.isRetweeted || false

    // Optimistic update
    setPost(prev => {
      if (!prev) return prev
      return {
        ...prev,
        retweets_count: isCurrentlyRetweeted ? prev.retweets_count - 1 : prev.retweets_count + 1,
        user_interaction_status: {
          isLiked: prev.user_interaction_status?.isLiked || false,
          isRetweeted: !isCurrentlyRetweeted,
          isBookmarked: prev.user_interaction_status?.isBookmarked || false
        }
      }
    })

    try {
      await toggleRetweet(postId, user.id)
    } catch (error) {
      console.error('Error toggling retweet:', error)
      // Revert on error
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          retweets_count: isCurrentlyRetweeted ? prev.retweets_count + 1 : prev.retweets_count - 1,
          user_interaction_status: {
            isLiked: prev.user_interaction_status?.isLiked || false,
            isRetweeted: isCurrentlyRetweeted,
            isBookmarked: prev.user_interaction_status?.isBookmarked || false
          }
        }
      })
    }
  }, [user?.id, post])

  const handleBookmark = useCallback(async (postId: string) => {
    if (!user?.id || !post) return

    const isCurrentlyBookmarked = post.user_interaction_status?.isBookmarked || false

    // Optimistic update
    setPost(prev => {
      if (!prev) return prev
      return {
        ...prev,
        user_interaction_status: {
          isLiked: prev.user_interaction_status?.isLiked || false,
          isRetweeted: prev.user_interaction_status?.isRetweeted || false,
          isBookmarked: !isCurrentlyBookmarked
        }
      }
    })

    try {
      await togglePostBookmark(postId, user.id)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      // Revert on error
      setPost(prev => {
        if (!prev) return prev
        return {
          ...prev,
          user_interaction_status: {
            isLiked: prev.user_interaction_status?.isLiked || false,
            isRetweeted: prev.user_interaction_status?.isRetweeted || false,
            isBookmarked: isCurrentlyBookmarked
          }
        }
      })
    }
  }, [user?.id, post])

  const handleDelete = useCallback(async () => {
    // Post silme işlemi - implement edilecek
    console.log('Delete post:', postId)
  }, [postId])

  // Suppress unused warning - will be implemented later
  void handleDelete

  if (loading) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
            <LeftSidebar />
            <div className="lg:col-span-2 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border pb-20">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <RightSidebar />
          </div>
        </main>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
            <LeftSidebar />
            <div className="lg:col-span-2 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border pb-20">
              <div className="sticky top-0 z-10 bg-soc-ai-header/60 backdrop-blur px-3 sm:px-4 py-3 border-b border-border">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="h-8 w-8 rounded-full"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-lg sm:text-xl font-semibold text-foreground">Gönderi</h1>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center h-64 px-4">
                <p className="text-lg font-semibold text-foreground mb-2">{error || 'Gönderi bulunamadı'}</p>
                <Button onClick={() => router.back()} variant="outline">
                  Geri Dön
                </Button>
              </div>
            </div>
            <RightSidebar />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
          <LeftSidebar />

          <div className="lg:col-span-2 h-full min-h-0 overflow-y-auto scrollbar-hide border-x border-border pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-soc-ai-header/60 backdrop-blur px-3 sm:px-4 py-3 border-b border-border">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="h-8 w-8 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg sm:text-xl font-semibold text-foreground">Gönderi</h1>
              </div>
            </div>

            {/* Post Detail Card */}
            <Card className="w-full border-0 border-b border-border bg-transparent dark:bg-[#171717] rounded-none">
              <CardContent className="p-4 sm:p-6">
                {/* Author Info */}
                <div className="flex items-start space-x-3 mb-4">
                  <Avatar 
                    className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/users/${post.author.id}`)}
                  >
                    <AvatarImage 
                      src={post.author.avatar_url} 
                      alt={post.author.username}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                      {post.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-semibold text-foreground hover:underline cursor-pointer"
                      onClick={() => router.push(`/users/${post.author.id}`)}
                    >
                      {post.author.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{post.author.username}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-foreground text-lg leading-relaxed whitespace-pre-wrap break-words">
                    {post.content}
                  </p>
                </div>

                {/* Multiple Post Images */}
                {post.image_urls && post.image_urls.length > 0 && (
                  <div className={`w-full mb-4 grid gap-2 ${
                    post.image_urls.length === 1 ? 'grid-cols-1' :
                    post.image_urls.length === 2 ? 'grid-cols-2' :
                    post.image_urls.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {post.image_urls.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className={`relative rounded-xl overflow-hidden border border-border/50 ${
                          post.image_urls!.length === 3 && index === 0 ? 'col-span-2' : ''
                        }`}
                      >
                        <div className="relative w-full" style={{ aspectRatio: post.image_urls!.length === 1 ? '16/9' : '1/1' }}>
                          <Image
                            src={imageUrl}
                            alt={`Post image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div className="text-sm text-muted-foreground mb-4">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: tr })}
                  {' · '}
                  {new Date(post.created_at).toLocaleDateString('tr-TR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>

                <Separator className="my-4" />

                {/* Stats */}
                <div className="flex items-center space-x-6 mb-4">
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-foreground">{post.retweets_count}</span>
                    <span className="text-sm text-muted-foreground">Yeniden Paylaşım</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-foreground">{post.likes_count}</span>
                    <span className="text-sm text-muted-foreground">Beğeni</span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Actions */}
                <PostActions
                  commentsCount={post.comments_count}
                  retweetsCount={post.retweets_count}
                  likesCount={post.likes_count}
                  isLiked={post.user_interaction_status?.isLiked || false}
                  isRetweeted={post.user_interaction_status?.isRetweeted || false}
                  isBookmarked={post.user_interaction_status?.isBookmarked || false}
                  onLike={() => handleLike(post.id)}
                  onRetweet={() => handleRetweet(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                  onComment={() => {}}
                />
              </CardContent>
            </Card>

            {/* Comments Section */}
            <div className="border-t border-border">
              {/* Comment Input */}
              {user && (
                <CommentInput 
                  onSubmit={handleCreateComment}
                  placeholder="Yorumunuzu yazın..."
                />
              )}

              {/* Comments List */}
              <div>
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <p className="text-muted-foreground">Henüz yorum yok. İlk yorumu siz yapın!</p>
                  </div>
                ) : (
                  <div>
                    {comments.map((comment) => (
                      <CommentCard
                        key={comment.id}
                        comment={comment}
                        canDelete={user?.id === comment.author_id}
                        onDelete={handleDeleteComment}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <RightSidebar />
        </div>
      </main>
    </div>
  )
}

