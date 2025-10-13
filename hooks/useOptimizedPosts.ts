import { useState, useEffect, useCallback, useMemo } from 'react'
import { PostWithAuthor } from '@/lib/types'
import { postQueryService } from '@/lib/services/postQueryService'

export function useOptimizedUserPosts(userId: string, viewerUserId?: string, limit: number = 50) {
  const [allPosts, setAllPosts] = useState<PostWithAuthor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAllPosts = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      // Kullanıcının kendi gönderilerini al (medya dahil)
      const userPosts = await postQueryService.getUserAllPosts(userId, limit, 0, viewerUserId)
      
      // Beğenilen ve kaydedilen gönderiler için ayrı çağrılar (bunlar farklı kullanıcıların gönderileri)
      const [likedPosts, favoritePosts] = await Promise.all([
        postQueryService.getUserLikedPosts(userId, limit, 0, viewerUserId),
        postQueryService.getUserFavoritePosts(userId, limit, 0, viewerUserId)
      ])

      // Tüm gönderileri birleştir
      const allPosts = [...userPosts, ...likedPosts, ...favoritePosts]
      
      // Duplicate'leri kaldır
      const uniquePosts = allPosts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      )

      setAllPosts(uniquePosts)
    } catch (err) {
      setError('Failed to load user posts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId, viewerUserId, limit])

  useEffect(() => {
    loadAllPosts()
  }, [loadAllPosts])

  // Client-side filtreleme ile farklı kategorileri oluştur
  const filteredPosts = useMemo(() => {
    if (!allPosts.length) {
      return {
        posts: [],
        likedPosts: [],
        favoritePosts: [],
        mediaPosts: []
      }
    }

    // Kullanıcının kendi gönderileri (orijinal posts)
    const posts = allPosts.filter(post => post.author_id === userId)

    // Medya gönderileri (image_urls olan gönderiler)
    const mediaPosts = posts.filter(post => 
      post.image_urls && post.image_urls.length > 0
    )

    // Beğenilen gönderiler (kullanıcının beğendiği gönderiler)
    const likedPosts = allPosts.filter(post => 
      post.user_interaction_status?.isLiked === true
    )

    // Kaydedilen gönderiler (kullanıcının kaydettiği gönderiler)
    const favoritePosts = allPosts.filter(post => 
      post.user_interaction_status?.isBookmarked === true
    )

    return {
      posts,
      likedPosts,
      favoritePosts,
      mediaPosts
    }
  }, [allPosts, userId])

  const refresh = useCallback(() => {
    loadAllPosts()
  }, [loadAllPosts])

  // Optimistic updates için setter fonksiyonları
  const setPosts = useCallback((newPosts: PostWithAuthor[]) => {
    setAllPosts(prev => {
      // Kullanıcının kendi gönderilerini güncelle
      const otherPosts = prev.filter(post => post.author_id !== userId)
      return [...otherPosts, ...newPosts]
    })
  }, [userId])

  const setLikedPosts = useCallback((newLikedPosts: PostWithAuthor[]) => {
    // Liked posts için interaction status'u güncelle
    setAllPosts(prev => prev.map(post => {
      const isLiked = newLikedPosts.some(likedPost => likedPost.id === post.id)
      return {
        ...post,
        user_interaction_status: {
          isLiked,
          isRetweeted: post.user_interaction_status?.isRetweeted || false,
          isBookmarked: post.user_interaction_status?.isBookmarked || false
        }
      }
    }))
  }, [])

  const setFavoritePosts = useCallback((newFavoritePosts: PostWithAuthor[]) => {
    // Favorite posts için interaction status'u güncelle
    setAllPosts(prev => prev.map(post => {
      const isBookmarked = newFavoritePosts.some(favPost => favPost.id === post.id)
      return {
        ...post,
        user_interaction_status: {
          isLiked: post.user_interaction_status?.isLiked || false,
          isRetweeted: post.user_interaction_status?.isRetweeted || false,
          isBookmarked
        }
      }
    }))
  }, [])

  const setMediaPosts = useCallback((newMediaPosts: PostWithAuthor[]) => {
    // Media posts için image_urls'i güncelle
    setAllPosts(prev => prev.map(post => {
      const mediaPost = newMediaPosts.find(mediaPost => mediaPost.id === post.id)
      if (mediaPost) {
        return {
          ...post,
          image_urls: mediaPost.image_urls
        }
      }
      return post
    }))
  }, [])

  return {
    ...filteredPosts,
    setPosts,
    setLikedPosts,
    setFavoritePosts,
    setMediaPosts,
    loading,
    error,
    refresh
  }
}
