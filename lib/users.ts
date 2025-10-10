import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email?: string
  name?: string
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
