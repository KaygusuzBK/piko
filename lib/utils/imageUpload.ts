import { supabase } from '../supabase'

export interface ImageUploadOptions {
  maxSizeInMB?: number
  allowedTypes?: string[]
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxSizeInMB: 5,
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
}

export async function uploadPostImage(
  userId: string,
  file: File,
  options: ImageUploadOptions = {}
): Promise<string | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Validate file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    throw new Error(`Geçersiz dosya tipi. İzin verilen tipler: ${opts.allowedTypes.join(', ')}`)
  }

  // Validate file size
  const maxSizeInBytes = (opts.maxSizeInMB || 5) * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    throw new Error(`Dosya boyutu ${opts.maxSizeInMB}MB'dan küçük olmalıdır`)
  }

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('post-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Image upload error:', error)
      throw new Error('Resim yüklenirken bir hata oluştu')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(data.path)

    return publicUrl
  } catch (error) {
    console.error('Image upload error:', error)
    throw error
  }
}

export async function deletePostImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract path from URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/post-images/')
    if (pathParts.length < 2) {
      console.error('Invalid image URL')
      return false
    }

    const filePath = pathParts[1]

    const { error } = await supabase.storage
      .from('post-images')
      .remove([filePath])

    if (error) {
      console.error('Image delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Image delete error:', error)
    return false
  }
}

export function validateImageFile(file: File, options: ImageUploadOptions = {}): string | null {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // Check file type
  if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
    return `Geçersiz dosya tipi. İzin verilen tipler: JPG, PNG, GIF, WEBP`
  }

  // Check file size
  const maxSizeInBytes = (opts.maxSizeInMB || 5) * 1024 * 1024
  if (file.size > maxSizeInBytes) {
    return `Dosya boyutu ${opts.maxSizeInMB}MB'dan küçük olmalıdır`
  }

  return null
}

