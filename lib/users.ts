import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email?: string
  name?: string
  username?: string
  avatar_url?: string
  banner_url?: string
  bio?: string
  website?: string
  location?: string
  phone?: string
  created_at?: string
  updated_at?: string
  // Diğer alanları tablo yapısına göre ekleyebiliriz
}

export async function fetchUsers(): Promise<User[]> {
  try {
    console.log('Fetching users from Supabase...') // Debug
    
    // Önce users tablosunu dene
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Users table response:', { data: usersData, error: usersError }) // Debug

    // Eğer users tablosunda veri varsa onu döndür
    if (usersData && usersData.length > 0) {
      console.log('Returning users from users table:', usersData) // Debug
      return usersData
    }

    // Eğer users tablosu boşsa, mevcut kullanıcıyı döndür (test için)
    console.log('Users table empty, returning current user as test data...') // Debug
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    
    if (currentUser) {
      const testUser: User = {
        id: currentUser.id,
        email: currentUser.email || '',
        name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Test User',
        created_at: currentUser.created_at,
        updated_at: currentUser.updated_at
      }
      console.log('Returning test user:', testUser) // Debug
      return [testUser]
    }

    console.log('No current user found') // Debug
    return []

  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

// Tek bir kullanıcıyı id ile getir
export async function fetchUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching user by id:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user by id:', error)
    return null
  }
}

export type UpdateUserPayload = Partial<
  Pick<User, 'name' | 'username' | 'avatar_url' | 'banner_url' | 'bio' | 'website' | 'location' | 'phone'>
>

export async function updateUserById(id: string, payload: UpdateUserPayload): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return null
    }

    return data as User
  } catch (e) {
    console.error('Error updating user:', e)
    return null
  }
}

export async function uploadUserImage(
  userId: string,
  file: File,
  kind: 'avatar' | 'banner'
): Promise<string | null> {
  try {
    const bucket = kind === 'avatar' ? 'avatars' : 'banners'
    const ext = file.name.split('.').pop() || 'png'
    const path = `${userId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: true,
      contentType: file.type,
    })
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
  } catch (e) {
    console.error('Error uploading image:', e)
    return null
  }
}
