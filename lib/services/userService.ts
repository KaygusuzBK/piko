import { User, UpdateUserPayload, ImageUploadType } from '@/lib/types'
import { userRepository } from '@/lib/repositories/userRepository'

export class UserService {
  async getUserById(id: string): Promise<User | null> {
    return await userRepository.findById(id)
  }

  async updateUser(id: string, payload: UpdateUserPayload): Promise<User | null> {
    return await userRepository.update(id, payload)
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return await userRepository.search(query, limit)
  }

  async uploadUserImage(
    userId: string,
    file: File,
    type: ImageUploadType
  ): Promise<string | null> {
    return await userRepository.uploadImage(userId, file, type)
  }

  async ensureUserProfile(userId: string): Promise<boolean> {
    return await userRepository.ensureProfile(userId)
  }
}

// Singleton instance
export const userService = new UserService()

