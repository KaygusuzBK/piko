// Legacy exports for backward compatibility
// All functionality delegated to services

export * from './types/user.types'

import { userService } from './services/userService'
import { User, UpdateUserPayload, ImageUploadType } from './types'

export async function fetchUsers(): Promise<User[]> {
  // Legacy function - not commonly used
  // Could be implemented if needed
  console.warn('fetchUsers is deprecated, use userService.searchUsers instead')
  return []
}

export async function fetchUserById(id: string): Promise<User | null> {
  return userService.getUserById(id)
}

export async function updateUserById(id: string, payload: UpdateUserPayload): Promise<User | null> {
  return userService.updateUser(id, payload)
}

export async function searchUsers(query: string, limit: number = 20): Promise<User[]> {
  return userService.searchUsers(query, limit)
}

export async function uploadUserImage(
  userId: string,
  file: File,
  kind: ImageUploadType
): Promise<string | null> {
  return userService.uploadUserImage(userId, file, kind)
}
