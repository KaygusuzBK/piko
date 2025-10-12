// Legacy exports for backward compatibility
// All functionality delegated to services

export * from './types/post.types'
export * from './types/interaction.types'

import { postService } from './services/postService'
import { postQueryService } from './services/postQueryService'
import { postInteractionService } from './services/postInteractionService'
import { CreatePostData, Post, PostWithAuthor } from './types'

// Post CRUD operations
export async function createPost(data: CreatePostData): Promise<Post | null> {
  return postService.createPost(data)
}

export async function deletePost(postId: string, userId: string): Promise<boolean> {
  return postService.deletePost(postId, userId)
}

// Query operations
export async function getPosts(limit: number = 20, offset: number = 0, userId?: string): Promise<PostWithAuthor[]> {
  return postQueryService.getFeedPosts(limit, offset, userId)
}

export async function getUserPosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
  return postQueryService.getUserPosts(userId, limit, offset, viewerUserId)
}

export async function getUserLikedPosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
  return postQueryService.getUserLikedPosts(userId, limit, offset, viewerUserId)
}

export async function getUserFavoritePosts(userId: string, limit: number = 20, offset: number = 0, viewerUserId?: string): Promise<PostWithAuthor[]> {
  return postQueryService.getUserFavoritePosts(userId, limit, offset, viewerUserId)
}

export async function getPostById(postId: string, viewerUserId?: string): Promise<PostWithAuthor | null> {
  return postQueryService.getPostById(postId, viewerUserId)
}

// Interaction operations
export async function toggleLike(postId: string, userId: string): Promise<boolean> {
  return postInteractionService.toggleLike(postId, userId)
}

export async function toggleRetweet(postId: string, userId: string): Promise<boolean> {
  return postInteractionService.toggleRetweet(postId, userId)
}

export async function togglePostLike(postId: string, userId: string): Promise<boolean> {
  return postInteractionService.toggleLike(postId, userId)
}

export async function togglePostRetweet(postId: string, userId: string): Promise<boolean> {
  return postInteractionService.toggleRetweet(postId, userId)
}

export async function togglePostBookmark(postId: string, userId: string): Promise<boolean> {
  return postInteractionService.toggleBookmark(postId, userId)
}

export async function getUserInteractionStatus(postId: string, userId: string) {
  return postInteractionService.getInteractionStatus(postId, userId)
}

// Legacy function - kept for compatibility
export async function ensureProfile(userId: string): Promise<boolean> {
  const { userRepository } = await import('./repositories/userRepository')
  return userRepository.ensureProfile(userId)
}

// Legacy function - kept for compatibility  
export async function getUserPostInteractions(userId: string, postIds: string[]) {
  const { interactionRepository } = await import('./repositories/interactionRepository')
  return interactionRepository.getUserInteractions(userId, postIds)
}
