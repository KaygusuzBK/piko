'use client'

import { useParams } from 'next/navigation'
import { useHashtagPosts, useHashtagStats } from '@/hooks/useHashtags'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PostCard } from '@/components/PostCard'
import { Hash, MessageCircle, Heart, Repeat2 } from 'lucide-react'
import { usePostInteractions } from '@/hooks/usePostInteractions'
import { useAuthStore } from '@/stores/authStore'

export default function HashtagPage() {
  const params = useParams()
  const hashtagName = params.name as string
  const { user } = useAuthStore()
  const { toggleLike, toggleRetweet, toggleBookmark } = usePostInteractions()

  const { data: posts = [], isLoading: postsLoading } = useHashtagPosts(hashtagName, 20, 0)
  const { data: stats } = useHashtagStats(hashtagName)

  const handleLike = async (postId: string) => {
    if (!user?.id) return
    await toggleLike(postId, user.id)
  }

  const handleRetweet = async (postId: string) => {
    if (!user?.id) return
    await toggleRetweet(postId, user.id)
  }

  const handleBookmark = async (postId: string) => {
    if (!user?.id) return
    await toggleBookmark(postId, user.id)
  }

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Hashtag Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Hash className="h-6 w-6" />
            #{hashtagName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats && (
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" />
                {stats.posts_count} gönderi
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {stats.total_likes} beğeni
              </div>
              <div className="flex items-center gap-1">
                <Repeat2 className="h-4 w-4" />
                {stats.total_retweets} retweet
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts */}
      <div className="space-y-4">
        {postsLoading ? (
          <div className="text-center py-8">
            <div className="text-lg">Yükleniyor...</div>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Hash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Henüz gönderi yok</h3>
              <p className="text-muted-foreground">
                #{hashtagName} hashtagi ile henüz hiç gönderi paylaşılmamış.
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={handleLike}
              onRetweet={handleRetweet}
              onBookmark={handleBookmark}
              onComment={handleComment}
              currentUserId={user?.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
