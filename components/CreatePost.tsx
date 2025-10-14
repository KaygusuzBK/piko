'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/authStore'
import { createPost, CreatePostData, Post } from '@/lib/posts'
import { uploadMultiplePostImages, validateImageFile } from '@/lib/utils/imageUpload'
import { EmojiPicker } from '@/components/EmojiPicker'
import { AISuggestions } from '@/components/AISuggestions'
import { MediaPicker } from '@/components/MediaPicker'
import { PollCreator } from '@/components/poll/PollCreator'
import { Send, X, BarChart3 } from 'lucide-react'
import Image from 'next/image'

interface CreatePostProps {
  onPostCreated?: (newPost: Post) => void
  isCompact?: boolean
}

const MAX_IMAGES = 4

export function CreatePost({ onPostCreated, isCompact = false }: CreatePostProps) {
  const { user } = useAuthStore()
  const [content, setContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPollCreator, setShowPollCreator] = useState(false)
  const [createdPostId, setCreatedPostId] = useState<string | null>(null)

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setUploadError(null)
  }

  const handleRemoveAllImages = () => {
    setSelectedImages([])
    setImagePreviews([])
    setUploadError(null)
  }

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji)
  }

  const handleAISuggestion = (suggestion: string) => {
    setContent(suggestion)
  }

  const handleMediaSelect = (files: File[], type: 'image' | 'video' | 'gif') => {
    if (type === 'image') {
      // Check total count
      const totalImages = selectedImages.length + files.length
      if (totalImages > MAX_IMAGES) {
        setUploadError(`En fazla ${MAX_IMAGES} medya ekleyebilirsiniz`)
        return
      }

      // Validate each file
      const validFiles: File[] = []
      const newPreviews: string[] = []

      for (const file of files) {
        const error = validateImageFile(file)
        if (error) {
          setUploadError(error)
          return
        }
        validFiles.push(file)
      }

      // Create previews
      validFiles.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          newPreviews.push(reader.result as string)
          if (newPreviews.length === validFiles.length) {
            setImagePreviews(prev => [...prev, ...newPreviews])
          }
        }
        reader.readAsDataURL(file)
      })

      setUploadError(null)
      setSelectedImages(prev => [...prev, ...validFiles])
    } else if (type === 'video' || type === 'gif') {
      // For now, treat videos and GIFs as images
      // In production, you'd handle these separately
      const file = files[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
        setSelectedImages(prev => [...prev, file])
      }
    }
  }

  const handlePost = async () => {
    if ((!content.trim() && selectedImages.length === 0) || !user) return

    setIsPosting(true)
    try {
      let imageUrls: string[] = []

      // Upload images if selected
      if (selectedImages.length > 0) {
        console.log('Uploading images...', selectedImages.map(f => f.name))
        imageUrls = await uploadMultiplePostImages(user.id, selectedImages)
        console.log('Images uploaded, URLs:', imageUrls)
      }

      const postData: CreatePostData = {
        content: content.trim(),
        image_urls: imageUrls.length > 0 ? imageUrls : undefined,
        type: imageUrls.length > 0 ? 'media' : 'text',
        author_id: user.id
      }
      
      console.log('Creating post with data:', postData)
      const newPost = await createPost(postData)
      
      if (newPost) {
        setContent('')
        handleRemoveAllImages()
        // Anket oluşturma durumunu kontrol et
        if (showPollCreator) {
          setCreatedPostId(newPost.id)
        }
        onPostCreated?.(newPost)
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

  const handlePollCreated = () => {
    setShowPollCreator(false)
    setCreatedPostId(null)
  }

  const handleCancelPoll = () => {
    setShowPollCreator(false)
    setCreatedPostId(null)
  }

  return (
    <>
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
                      <MediaPicker 
                        onMediaSelect={handleMediaSelect}
                        disabled={selectedImages.length >= MAX_IMAGES}
                      />
                      <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (content.trim() || selectedImages.length > 0) {
                            // Önce post oluştur, sonra anket ekle
                            handlePost()
                            setShowPollCreator(true)
                          }
                        }}
                        className="group h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white disabled:opacity-50 transition-all duration-200 hover:scale-110"
                        disabled={!content.trim() && selectedImages.length === 0}
                        title="Anket oluştur"
                      >
                        <BarChart3 className="h-3 w-3 group-active:text-blue-500 dark:group-active:text-blue-400 transition-transform duration-200 hover:scale-125" />
                        <span className="sr-only">Anket oluştur</span>
                      </Button>
                      <AISuggestions 
                        onSuggestionSelect={handleAISuggestion}
                        currentContent={content}
                      />
                      {selectedImages.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedImages.length}/{MAX_IMAGES}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground dark:text-white/60'}`}>
                        {content.length}/280
                      </span>
                      <Button
                        onClick={handlePost}
                        disabled={(!content.trim() && selectedImages.length === 0) || isPosting || content.length > 280}
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
                    <MediaPicker 
                      onMediaSelect={handleMediaSelect}
                      disabled={selectedImages.length >= MAX_IMAGES}
                    />
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    <AISuggestions 
                      onSuggestionSelect={handleAISuggestion}
                      currentContent={content}
                    />
                    <span className={`text-xs ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground dark:text-white/60'}`}>
                      {content.length}/280
                    </span>
                    <Button
                      onClick={handlePost}
                      disabled={(!content.trim() && selectedImages.length === 0) || isPosting || content.length > 280}
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
                
                {/* Multiple Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className={`w-full mb-2 grid gap-2 ${
                    imagePreviews.length === 1 ? 'grid-cols-1' :
                    imagePreviews.length === 2 ? 'grid-cols-2' :
                    imagePreviews.length === 3 ? 'grid-cols-2' :
                    'grid-cols-2'
                  }`}>
                    {imagePreviews.map((preview, index) => (
                      <div 
                        key={index} 
                        className={`relative rounded-lg overflow-hidden border border-border ${
                          imagePreviews.length === 3 && index === 0 ? 'col-span-2' : ''
                        }`}
                      >
                        <div className="relative w-full" style={{ aspectRatio: imagePreviews.length === 1 ? '16/9' : '1/1' }}>
                          <Image
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <Button
                          onClick={() => handleRemoveImage(index)}
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 rounded-full shadow-lg"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <p className="text-xs text-red-500 mb-2">{uploadError}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <MediaPicker 
                      onMediaSelect={handleMediaSelect}
                      disabled={selectedImages.length >= MAX_IMAGES}
                    />
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (content.trim() || selectedImages.length > 0) {
                          // Önce post oluştur, sonra anket ekle
                          handlePost()
                          setShowPollCreator(true)
                        }
                      }}
                      className="group h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white disabled:opacity-50 transition-all duration-200 hover:scale-110"
                      disabled={!content.trim() && selectedImages.length === 0}
                      title="Anket oluştur"
                    >
                      <BarChart3 className="h-3 w-3 group-active:text-blue-500 dark:group-active:text-blue-400 transition-transform duration-200 hover:scale-125" />
                      <span className="sr-only">Anket oluştur</span>
                    </Button>
                    <AISuggestions 
                      onSuggestionSelect={handleAISuggestion}
                      currentContent={content}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <span className={`text-xs sm:text-sm ${content.length > 250 ? 'text-red-400' : 'text-muted-foreground dark:text-white/60'}`}>
                      {content.length}/280
                    </span>
                    <Separator orientation="vertical" className="h-2 sm:h-3" />
                    <Button
                      onClick={handlePost}
                      disabled={(!content.trim() && selectedImages.length === 0) || isPosting || content.length > 280}
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

    {/* Poll Creator Modal */}
    {showPollCreator && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {createdPostId ? (
            <PollCreator
              postId={createdPostId}
              onPollCreated={handlePollCreated}
              onCancel={handleCancelPoll}
            />
          ) : (
            <div className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Anket Oluşturuluyor</h3>
              <p className="text-muted-foreground mb-4">
                Önce gönderiniz oluşturuluyor, ardından anket ekleyebilirsiniz.
              </p>
              <Button variant="outline" onClick={handleCancelPoll}>
                İptal
              </Button>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  )
}
