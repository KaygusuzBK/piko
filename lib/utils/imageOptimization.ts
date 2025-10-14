import { ImageProps } from 'next/image'

export interface BlurImageProps extends Omit<ImageProps, 'placeholder'> {
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

/**
 * Generate blur placeholder for images
 */
export async function getBlurPlaceholder(src: string): Promise<string> {
  try {
    // Simple base64 placeholder - in production you'd use a proper blur generation library
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  } catch (error) {
    console.error('Error generating blur placeholder:', error)
    return ''
  }
}

/**
 * Generate blur placeholder for multiple images
 */
export async function getBlurPlaceholders(srcs: string[]): Promise<Record<string, string>> {
  const placeholders: Record<string, string> = {}
  
  await Promise.all(
    srcs.map(async (src) => {
      try {
        const blurDataURL = await getBlurPlaceholder(src)
        placeholders[src] = blurDataURL
      } catch (error) {
        console.error(`Error generating blur placeholder for ${src}:`, error)
        placeholders[src] = ''
      }
    })
  )
  
  return placeholders
}

/**
 * Optimized Image component with blur placeholder
 */
export function createOptimizedImageProps(
  src: string,
  blurDataURL?: string,
  width?: number,
  height?: number
): BlurImageProps {
  return {
    src,
    width: width || 800,
    height: height || 600,
    placeholder: blurDataURL ? 'blur' : 'empty',
    blurDataURL,
    alt: '',
    loading: 'lazy',
    quality: 85,
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  }
}
