/**
 * Message Service
 * 
 * Business logic layer for messaging.
 * Handles message creation, retrieval, and management.
 */

import { messageRepository } from '@/lib/repositories/messageRepository'
import type {
  Conversation,
  Message,
  CreateMessageData,
  ConversationWithParticipants,
  MessageWithSender
} from '@/lib/types'

export class MessageService {
  private messageRepo = messageRepository

  /**
   * Start a conversation between two users
   */
  async startConversation(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      return await this.messageRepo.getOrCreateConversation(user1Id, user2Id)
    } catch (error) {
      console.error('Error in startConversation:', error)
      return null
    }
  }

  /**
   * Get conversations for a user
   */
  async getUserConversations(
    userId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<ConversationWithParticipants[]> {
    try {
      return await this.messageRepo.getUserConversations(userId, limit, offset)
    } catch (error) {
      console.error('Error in getUserConversations:', error)
      return []
    }
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MessageWithSender[]> {
    try {
      return await this.messageRepo.getConversationMessages(conversationId, limit, offset)
    } catch (error) {
      console.error('Error in getConversationMessages:', error)
      return []
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage(
    conversationId: string,
    senderId: string,
    content: string,
    replyToId?: string
  ): Promise<Message | null> {
    try {
      const messageData: CreateMessageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: 'text',
        reply_to_id: replyToId
      }

      return await this.messageRepo.sendMessage(messageData)
    } catch (error) {
      console.error('Error in sendTextMessage:', error)
      return null
    }
  }

  /**
   * Send a media message
   */
  async sendMediaMessage(
    conversationId: string,
    senderId: string,
    content: string,
    mediaUrl: string,
    messageType: 'image' | 'video' | 'file',
    replyToId?: string
  ): Promise<Message | null> {
    try {
      const messageData: CreateMessageData = {
        conversation_id: conversationId,
        sender_id: senderId,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        reply_to_id: replyToId
      }

      return await this.messageRepo.sendMessage(messageData)
    } catch (error) {
      console.error('Error in sendMediaMessage:', error)
      return null
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      return await this.messageRepo.markMessagesAsRead(conversationId, userId)
    } catch (error) {
      console.error('Error in markAsRead:', error)
      return false
    }
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    try {
      return await this.messageRepo.getUnreadMessageCount(conversationId, userId)
    } catch (error) {
      console.error('Error in getUnreadCount:', error)
      return 0
    }
  }

  /**
   * Get total unread message count for a user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      return await this.messageRepo.getTotalUnreadCount(userId)
    } catch (error) {
      console.error('Error in getTotalUnreadCount:', error)
      return 0
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, content: string, userId: string): Promise<boolean> {
    try {
      return await this.messageRepo.editMessage(messageId, content, userId)
    } catch (error) {
      console.error('Error in editMessage:', error)
      return false
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      return await this.messageRepo.deleteMessage(messageId, userId)
    } catch (error) {
      console.error('Error in deleteMessage:', error)
      return false
    }
  }

  /**
   * Get conversation by ID with participants
   */
  async getConversationById(conversationId: string, userId: string): Promise<ConversationWithParticipants | null> {
    try {
      const conversations = await this.messageRepo.getUserConversations(userId, 1, 0)
      return conversations.find(conv => conv.id === conversationId) || null
    } catch (error) {
      console.error('Error in getConversationById:', error)
      return null
    }
  }
}

// Singleton instance
export const messageService = new MessageService()
