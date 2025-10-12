import { useState, useEffect, useCallback } from 'react'
import { User, UpdateUserPayload, ImageUploadType } from '@/lib/types'
import { userService } from '@/lib/services/userService'

export function useUserProfile(userId: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUser = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const fetchedUser = await userService.getUserById(userId)
      setUser(fetchedUser)
    } catch (err) {
      setError('Failed to load user profile')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const refresh = useCallback(() => {
    loadUser()
  }, [loadUser])

  return {
    user,
    setUser,
    loading,
    error,
    refresh
  }
}

export function useUpdateProfile(userId: string) {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProfile = useCallback(async (payload: UpdateUserPayload): Promise<User | null> => {
    setUpdating(true)
    setError(null)
    try {
      const updatedUser = await userService.updateUser(userId, payload)
      return updatedUser
    } catch (err) {
      setError('Failed to update profile')
      console.error(err)
      return null
    } finally {
      setUpdating(false)
    }
  }, [userId])

  return {
    updateProfile,
    updating,
    error
  }
}

export function useImageUpload(userId: string, type: ImageUploadType) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true)
    setError(null)
    try {
      const url = await userService.uploadUserImage(userId, file, type)
      return url
    } catch (err) {
      setError('Failed to upload image')
      console.error(err)
      return null
    } finally {
      setUploading(false)
    }
  }, [userId, type])

  return {
    uploadImage,
    uploading,
    error
  }
}

