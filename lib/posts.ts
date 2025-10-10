import { createClient } from '@/lib/supabase'

export interface Post {
  id: string
  content: string
  author_id: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  retweets_count: number
}

export interface PostWithAuthor extends Post {
  author: {
    id: string
    username: string
    avatar_url?: string
  }
  user_interaction_status?: {
    isLiked: boolean
    isRetweeted: boolean
    isBookmarked: boolean
  }
}

export interface CreatePostData {
  content: string
  author_id: string
}

// Kullanıcı profilini güncelleme/oluşturma
export async function ensureProfile(userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Önce kullanıcı var mı kontrol et
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, username')
      .eq('id', userId)
      .single()

    if (existingUser && existingUser.username) {
      return true // Kullanıcı zaten var ve username'i var
    }

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking user:', checkError)
      return false
    }

    // Kullanıcı bilgilerini al
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      console.error('No authenticated user found')
      return false
    }

    // Benzersiz username oluştur
    let baseUsername = user.user.user_metadata?.user_name || 
                      user.user.user_metadata?.full_name?.toLowerCase().replace(/\s+/g, '') || 
                      user.user.email?.split('@')[0] || 
                      `user_${userId.slice(0, 8)}`
    
    // Username'i temizle (sadece harf, rakam ve alt çizgi)
    baseUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '')
    
    let username = baseUsername
    let counter = 1
    
    // Username benzersiz olana kadar dene
    while (true) {
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single()
      
      if (!existingUsername) {
        break // Username benzersiz
      }
      
      username = `${baseUsername}_${counter}`
      counter++
      
      if (counter > 1000) { // Sonsuz döngüyü önle
        username = `user_${userId.slice(0, 8)}_${Date.now()}`
        break
      }
    }

    // Kullanıcı zaten varsa sadece username'i güncelle
    if (existingUser) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          username: username,
          avatar_url: user.user.user_metadata?.avatar_url,
          bio: '',
          website: '',
          location: ''
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Error updating user profile:', updateError)
        return false
      }
    } else {
      // Kullanıcı yoksa oluştur (bu durumda auth.users'dan sync olmalı)
      console.log('User not found in public.users, should be synced from auth.users')
      return false
    }

    return true
  } catch (error) {
    console.error('Error ensuring profile:', error)
    return false
  }
}

export interface PostInteraction {
  id: string
  user_id: string
  post_id: string
  type: 'like' | 'retweet' | 'bookmark'
  created_at: string
}

// Gönderi oluşturma
export async function createPost(data: CreatePostData): Promise<Post | null> {
  try {
    const supabase = createClient()
    
    // Önce profil var mı kontrol et, yoksa oluştur
    const profileExists = await ensureProfile(data.author_id)
    if (!profileExists) {
      console.error('Failed to ensure profile exists')
      return null
    }
    
    const { data: post, error } = await supabase
      .from('posts')
      .insert([{
        content: data.content,
        author_id: data.author_id,
        likes_count: 0,
        comments_count: 0,
        retweets_count: 0
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating post:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      // Veritabanı tabloları henüz oluşturulmamışsa null döndür
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('Database tables not yet created, cannot create post')
        return null
      }
      
      // Profil bulunamadı hatası
      if (error.code === '23503' || error.message?.includes('foreign key')) {
        console.log('Profile not found, trying to create profile first')
        const profileCreated = await ensureProfile(data.author_id)
        if (profileCreated) {
          // Profil oluşturuldu, tekrar dene
          const { data: retryPost, error: retryError } = await supabase
            .from('posts')
            .insert([{
              content: data.content,
              author_id: data.author_id,
              likes_count: 0,
              comments_count: 0,
              retweets_count: 0
            }])
            .select()
            .single()
          
          if (retryError) {
            console.error('Error creating post after profile creation:', retryError)
            return null
          }
          
          return retryPost
        }
        return null
      }
      
      return null
    }

    return post
  } catch (error) {
    console.error('Error creating post:', error)
    return null
  }
}

// Gönderileri getirme (feed için) - kullanıcı etkileşimleri ile birlikte
export async function getPosts(limit: number = 20, offset: number = 0, userId?: string): Promise<PostWithAuthor[]> {
  try {
    const supabase = createClient()
    
    const { data: posts, error } = await supabase
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
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      // Veritabanı tabloları henüz oluşturulmamışsa boş array döndür
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('Database tables not yet created, returning empty array')
        return []
      }
      return []
    }

    // Kullanıcı etkileşimlerini işle
    const processedPosts = posts?.map(post => {
      const userInteractions = post.user_interactions?.filter(interaction => 
        interaction.user_id === userId
      ) || []

      const isLiked = userInteractions.some(interaction => interaction.type === 'like')
      const isRetweeted = userInteractions.some(interaction => interaction.type === 'retweet')
      const isBookmarked = userInteractions.some(interaction => interaction.type === 'bookmark')

      return {
        ...post,
        user_interaction_status: {
          isLiked,
          isRetweeted,
          isBookmarked
        }
      }
    }) || []

    return processedPosts
  } catch (error) {
    console.error('Error fetching posts:', error)
    return []
  }
}

// Kullanıcının gönderilerini getirme
export async function getUserPosts(userId: string, limit: number = 20, offset: number = 0): Promise<PostWithAuthor[]> {
  try {
    const supabase = createClient()

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:users!posts_author_id_fkey (
          id,
          username,
          avatar_url
        )
      `)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching user posts:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return []
    }

    return posts || []
  } catch (error) {
    console.error('Error fetching user posts:', error)
    return []
  }
}

// Gönderi beğenme/beğenmeme
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Önce mevcut beğeni var mı kontrol et
    const { data: existingLike, error: checkError } = await supabase
      .from('post_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError)
      return false
    }

    if (existingLike) {
      // Beğeni varsa kaldır
      const { error: deleteError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return false
      }

      // Count'u azalt
      await supabase.rpc('decrement_likes_count', { post_id: postId })
      return false // Beğeni kaldırıldı
    } else {
      // Beğeni yoksa ekle
      const { error: insertError } = await supabase
        .from('post_interactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'like'
        }])

      if (insertError) {
        console.error('Error adding like:', insertError)
        return false
      }

      // Count'u artır
      await supabase.rpc('increment_likes_count', { post_id: postId })
      return true // Beğeni eklendi
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return false
  }
}

// Gönderi retweet/retweet kaldırma
export async function toggleRetweet(postId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()

    // Önce mevcut retweet var mı kontrol et
    const { data: existingRetweet, error: checkError } = await supabase
      .from('post_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'retweet')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing retweet:', checkError)
      return false
    }

    if (existingRetweet) {
      // Retweet varsa kaldır
      const { error: deleteError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existingRetweet.id)

      if (deleteError) {
        console.error('Error removing retweet:', deleteError)
        return false
      }

      // Count'u azalt
      await supabase.rpc('decrement_retweets_count', { post_id: postId })
      return false // Retweet kaldırıldı
    } else {
      // Retweet yoksa ekle
      const { error: insertError } = await supabase
        .from('post_interactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'retweet'
        }])

      if (insertError) {
        console.error('Error adding retweet:', insertError)
        return false
      }

      // Count'u artır
      await supabase.rpc('increment_retweets_count', { post_id: postId })
      return true // Retweet eklendi
    }
  } catch (error) {
    console.error('Error toggling retweet:', error)
    return false
  }
}

// Kullanıcının beğeni durumunu kontrol et
export async function getUserInteractionStatus(postId: string, userId: string): Promise<{
  isLiked: boolean
  isRetweeted: boolean
  isBookmarked: boolean
}> {
  try {
    const supabase = createClient()

    const { data: interactions, error } = await supabase
      .from('post_interactions')
      .select('type')
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching user interactions:', error)
      return { isLiked: false, isRetweeted: false, isBookmarked: false }
    }

    const types = interactions?.map(i => i.type) || []
    
    return {
      isLiked: types.includes('like'),
      isRetweeted: types.includes('retweet'),
      isBookmarked: types.includes('bookmark')
    }
  } catch (error) {
    console.error('Error fetching user interaction status:', error)
    return { isLiked: false, isRetweeted: false, isBookmarked: false }
  }
}

// Gönderi beğenme/beğenmeme
export async function togglePostLike(postId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Önce mevcut beğeniyi kontrol et
    const { data: existingLike, error: checkError } = await supabase
      .from('post_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'like')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError)
      return false
    }

    if (existingLike) {
      // Beğeniyi kaldır
      const { error: deleteError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('Error removing like:', deleteError)
        return false
      }

      // Likes count'u azalt
      await supabase.rpc('decrement_likes_count', { post_id: postId })
    } else {
      // Beğeniyi ekle
      const { error: insertError } = await supabase
        .from('post_interactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'like'
        }])

      if (insertError) {
        console.error('Error adding like:', insertError)
        return false
      }

      // Likes count'u artır
      await supabase.rpc('increment_likes_count', { post_id: postId })
    }

    return true
  } catch (error) {
    console.error('Error toggling post like:', error)
    return false
  }
}

// Gönderi retweet etme/etmeme
export async function togglePostRetweet(postId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Önce mevcut retweet'i kontrol et
    const { data: existingRetweet, error: checkError } = await supabase
      .from('post_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'retweet')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing retweet:', checkError)
      return false
    }

    if (existingRetweet) {
      // Retweet'i kaldır
      const { error: deleteError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existingRetweet.id)

      if (deleteError) {
        console.error('Error removing retweet:', deleteError)
        return false
      }

      // Retweets count'u azalt
      await supabase.rpc('decrement_retweets_count', { post_id: postId })
    } else {
      // Retweet'i ekle
      const { error: insertError } = await supabase
        .from('post_interactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'retweet'
        }])

      if (insertError) {
        console.error('Error adding retweet:', insertError)
        return false
      }

      // Retweets count'u artır
      await supabase.rpc('increment_retweets_count', { post_id: postId })
    }

    return true
  } catch (error) {
    console.error('Error toggling post retweet:', error)
    return false
  }
}

// Gönderi kaydetme/kaydetmeme
export async function togglePostBookmark(postId: string, userId: string): Promise<boolean> {
  try {
    const supabase = createClient()
    
    // Önce mevcut bookmark'ı kontrol et
    const { data: existingBookmark, error: checkError } = await supabase
      .from('post_interactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('type', 'bookmark')
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing bookmark:', checkError)
      return false
    }

    if (existingBookmark) {
      // Bookmark'ı kaldır
      const { error: deleteError } = await supabase
        .from('post_interactions')
        .delete()
        .eq('id', existingBookmark.id)

      if (deleteError) {
        console.error('Error removing bookmark:', deleteError)
        return false
      }
    } else {
      // Bookmark'ı ekle
      const { error: insertError } = await supabase
        .from('post_interactions')
        .insert([{
          post_id: postId,
          user_id: userId,
          type: 'bookmark'
        }])

      if (insertError) {
        console.error('Error adding bookmark:', insertError)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error toggling post bookmark:', error)
    return false
  }
}

// Kullanıcının gönderi etkileşimlerini getirme
export async function getUserPostInteractions(userId: string, postIds: string[]): Promise<PostInteraction[]> {
  try {
    const supabase = createClient()
    
    const { data: interactions, error } = await supabase
      .from('post_interactions')
      .select('*')
      .eq('user_id', userId)
      .in('post_id', postIds)

    if (error) {
      console.error('Error fetching user interactions:', error)
      return []
    }

    return interactions || []
  } catch (error) {
    console.error('Error fetching user interactions:', error)
    return []
  }
}
