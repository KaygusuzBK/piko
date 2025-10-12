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
}

export type UpdateUserPayload = Partial<
  Pick<
    User,
    'name' | 'username' | 'avatar_url' | 'banner_url' | 'bio' | 'website' | 'location' | 'phone'
  >
>

export type ImageUploadType = 'avatar' | 'banner'

