'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'
import { createPost, CreatePostData } from '@/lib/posts'
import { uploadPostImage, validateImageFile } from '@/lib/utils/imageUpload'
import { Send, Image as ImageIcon, Zap, X } from 'lucide-react'
import Image from 'next/image'

interface CreatePostProps {
  onPostCreated?: () => void
  isCompact?: boolean
}

export function CreatePost({ onPostCreated, isCompact = false }: CreatePostProps) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Debug için
  console.log('CreatePost isCompact:', isCompact, 'isFocused:', isFocused)


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate image
    const error = validateImageFile(file)
    if (error) {
      setUploadError(error)
      return
    }

    setUploadError(null)
    setSelectedImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setUploadError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handlePost = async () => {
    if ((!content.trim() && !selectedImage) || !user) return

    setIsPosting(true)
    try {
      let imageUrl: string | undefined

      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadPostImage(user.id, selectedImage) || undefined
      }

      const postData: CreatePostData = {
        content: content.trim(),
        image_url: imageUrl,
        type: imageUrl ? 'media' : 'text',
        author_id: user.id
      }
      
      const newPost = await createPost(postData)
      
      if (newPost) {
        setContent('')
        handleRemoveImage()
        onPostCreated?.()
        console.log('Post created successfully:', newPost)
      } else {
        console.error('Failed to create post - no post returned')
        alert('Gönderi oluşturulamadı. Lütfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Post creation error:', error)
      alert('Gönderi oluşturulurken hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setIsPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handlePost()
    }
  }

  return (
    <Card className={`w-full border transition-all duration-300 ${
      isCompact && !isFocused ? 'bg-transparent border-transparent shadow-none h-6' : 'border-border bg-card dark:bg-transparent card-dark-gradient'
    }`}>
      <CardContent className={`transition-all duration-300 w-full ${
        isCompact && !isFocused ? 'h-6 flex items-center justify-between px-2' : 'p-1 sm:p-2'
      }`}>
        <div className={`flex space-x-1 sm:space-x-2 ${
          isCompact && !isFocused ? 'w-full justify-between' : ''
        }`}>
          <Avatar className={`flex-shrink-0 transition-all duration-300 ${
            isCompact && !isFocused ? 'h-6 w-6' : 'h-6 w-6 sm:h-8 sm:w-8'
          }`}>
            <AvatarImage 
              src={user?.user_metadata?.avatar_url} 
              alt={user?.user_metadata?.full_name || user?.email || 'Kullanıcı'}
              className="object-cover"
            />
            <AvatarFallback className={`font-semibold bg-primary text-primary-foreground transition-all duration-300 ${
              isCompact ? 'text-xs' : 'text-xs'
            }`}>
              {user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className={`flex-1 min-w-0 transition-all duration-300 ${
            isCompact && !isFocused ? 'flex items-center space-x-1' : 'space-y-1'
          }`}>
            {isCompact ? (
              // Kompakt mod: focus durumuna göre layout
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ne düşünüyorsun?"
                  className={`w-full resize-none border-0 bg-transparent text-xs placeholder:text-muted-foreground dark:placeholder:text-white/70 focus:outline-none focus:ring-0 text-foreground dark:text-white transition-all duration-200 ${
                    isFocused ? 'min-h-[60px]' : 'h-6'
                  }`}
                  maxLength={280}
                />
                
                {isFocused ? (
                  // Focus olduğunda: alt satırda butonlar - justify-between ile iki uzak köşe
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="group h-6 w-6 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white active:text-pink-500 dark:active:text-pink-400">
                        <ImageIcon className="h-3 w-3 group-active:text-pink-500 dark:group-active:text-pink-400" aria-hidden="true" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white">
                        <Zap className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground dark:text-white/60'}`}>
                        {content.length}/280
                      </span>
                      <Button
                        onClick={handlePost}
                        disabled={!content.trim() || isPosting || content.length > 280}
                        size="sm"
                        className="px-2 text-xs h-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Focus olmadığında: tüm iconlar sağ köşede
                  <div className="flex items-center justify-end w-full space-x-1">
                    <Button variant="ghost" size="icon" className="group h-6 w-6 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white active:text-pink-500 dark:active:text-pink-400">
                      <ImageIcon className="h-4 w-4 group-active:text-pink-500 dark:group-active:text-pink-400" aria-hidden="true" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white">
                      <Zap className="h-4 w-4" />
                    </Button>
                    <span className={`text-xs ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground dark:text-white/60'}`}>
                      {content.length}/280
                    </span>
                    <Button
                      onClick={handlePost}
                      disabled={!content.trim() || isPosting || content.length > 280}
                      size="sm"
                      className="px-2 text-xs h-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // Normal mod: mevcut düzen
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ne düşünüyorsun?"
                  className={`w-full resize-none border-0 bg-transparent text-xs sm:text-sm placeholder:text-muted-foreground dark:placeholder:text-white/70 focus:outline-none focus:ring-0 text-foreground dark:text-white transition-all duration-200 ${
                    isFocused ? 'min-h-[60px]' : 'min-h-[20px]'
                  }`}
                  maxLength={280}
                />
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full mb-2">
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      onClick={handleRemoveImage}
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <p className="text-xs text-red-500 mb-2">{uploadError}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => fileInputRef.current?.click()}
                      className="group h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white active:text-pink-500 dark:active:text-pink-400 transition-all duration-200 hover:scale-110"
                    >
                      <ImageIcon className="h-3 w-3 transition-transform duration-200 hover:rotate-12 group-active:text-pink-500 dark:group-active:text-pink-400" aria-hidden="true" />
                      <span className="sr-only">Resim ekle</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-all duration-200 hover:scale-110">
                      <Zap className="h-3 w-3 transition-transform duration-200 hover:scale-125" />
                      <span className="sr-only">Özel efekt ekle</span>
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className={`text-xs sm:text-sm ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground dark:text-white/60'}`}>
                      {content.length}/280
                    </span>
                    <Separator orientation="vertical" className="h-2 sm:h-3" />
                    <Button
                      onClick={handlePost}
                      disabled={(!content.trim() && !selectedImage) || isPosting || content.length > 280}
                      size="sm"
                      className="px-2 sm:px-3 text-xs h-6 sm:h-7 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
                    >
                      {isPosting ? (
                        <>
                          <span className="hidden sm:inline">Gönderiliyor...</span>
                          <span className="sm:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1 transition-transform duration-200 hover:translate-x-1" />
                          <span className="hidden sm:inline">Gönder</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
