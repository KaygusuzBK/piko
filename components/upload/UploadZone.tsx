'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, X, Image as ImageIcon, FileVideo, File } from 'lucide-react'
import { validateImageFile } from '@/lib/utils/imageUpload'
import Image from 'next/image'

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in bytes
  accept?: {
    'image/*': string[]
    'video/*': string[]
  }
  disabled?: boolean
  className?: string
}

export function UploadZone({
  onFilesSelected,
  maxFiles = 4,
  maxSize = 10 * 1024 * 1024, // 10MB
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov']
  },
  disabled = false,
  className = ''
}: UploadZoneProps) {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return

    const validFiles: File[] = []
    const newPreviews: Record<string, string> = {}
    const newProgress: Record<string, number> = {}

    // Validate files
    for (const file of acceptedFiles) {
      if (file.size > maxSize) {
        console.error(`File ${file.name} is too large`)
        continue
      }

      // Validate image files
      if (file.type.startsWith('image/')) {
        const error = validateImageFile(file)
        if (error) {
          console.error(`Image validation error for ${file.name}:`, error)
          continue
        }
      }

      validFiles.push(file)
      newProgress[file.name] = 0

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = () => {
          newPreviews[file.name] = reader.result as string
          setPreviews(prev => ({ ...prev, ...newPreviews }))
        }
        reader.readAsDataURL(file)
      }
    }

    setUploadProgress(prev => ({ ...prev, ...newProgress }))
    onFilesSelected(validFiles)
  }, [disabled, maxSize, onFilesSelected])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
    disabled,
    multiple: true
  })

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-8 w-8 text-blue-500" />
    } else if (file.type.startsWith('video/')) {
      return <FileVideo className="h-8 w-8 text-purple-500" />
    } else {
      return <File className="h-8 w-8 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`w-full ${className}`}>
      <Card
        {...getRootProps()}
        className={`
          cursor-pointer transition-all duration-200 border-2 border-dashed
          ${isDragActive && !isDragReject 
            ? 'border-primary bg-primary/5' 
            : isDragReject 
            ? 'border-destructive bg-destructive/5' 
            : 'border-border hover:border-primary/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <CardContent className="p-6">
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">
                {isDragActive 
                  ? 'Dosyaları buraya bırakın' 
                  : 'Dosyaları sürükleyin veya tıklayın'
                }
              </h3>
              <p className="text-sm text-muted-foreground">
                Maksimum {maxFiles} dosya, her biri {formatFileSize(maxSize)} boyutunda
              </p>
              <p className="text-xs text-muted-foreground">
                Desteklenen formatlar: JPEG, PNG, WebP, MP4, WebM
              </p>
            </div>

            {!isDragActive && (
              <Button variant="outline" disabled={disabled}>
                Dosya Seç
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File Previews */}
      {Object.keys(previews).length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium">Seçilen Dosyalar:</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(previews).map(([fileName, preview]) => (
              <div key={fileName} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={preview}
                    alt={fileName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                
                {/* Remove button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    setPreviews(prev => {
                      const newPreviews = { ...prev }
                      delete newPreviews[fileName]
                      return newPreviews
                    })
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* Progress bar */}
                {uploadProgress[fileName] !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 p-1">
                    <Progress 
                      value={uploadProgress[fileName]} 
                      className="h-1"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
