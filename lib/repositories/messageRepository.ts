/**
 * Message Repository
 * 
 * Data access layer for messages and conversations.
 * Handles all database operations related to messaging.
 */

import { createClient } from '@/lib/supabase'
import type { 
  Conversation,
  Message,
  CreateMessageData,
  ConversationWithParticipants,
  MessageWithSender
} from '@/lib/types'

export class MessageRepository {
  private supabase = createClient()

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(user1Id: string, user2Id: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_or_create_conversation', {
        user1_id: user1Id,
        user2_id: user2Id
      })

      if (error) {
        console.error('Error getting or creating conversation:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error)
      return null
    }
  }

  /**
   * Get conversations for a user with participants and last message
   */
  async getUserConversations(userId: string, limit: number = 50, offset: number = 0): Promise<ConversationWithParticipants[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversations')
        .select(`
          *,
          participant_1:users!conversations_participant_1_id_fkey (
            id,
            username,
            name,
            avatar_url
          ),
          participant_2:users!conversations_participant_2_id_fkey (
            id,
            username,
            name,
            avatar_url
          ),
          last_message:messages (
            id,
            content,
            message_type,
            created_at,
            sender_id
          )
        `)
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching conversations:', error)
        return []
      }

      // Calculate unread count for each conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const unreadCount = await this.getUnreadMessageCount(conv.id, userId)
          return {
            ...conv,
            unread_count: unreadCount
          }
        })
      )

      return conversationsWithUnread
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
      const { data, error } = await this.supabase
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey (
            id,
            username,
            name,
            avatar_url
          ),
          reply_to:messages!messages_reply_to_id_fkey (
            id,
            content,
            message_type,
            sender:users!messages_sender_id_fkey (
              id,
              username,
              name,
              avatar_url
            )
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching messages:', error)
        return []
      }

      return (data || []).reverse() // Reverse to show oldest first
    } catch (error) {
      console.error('Error in getConversationMessages:', error)
      return []
    }
  }

  /**
   * Send a message
   */
  async sendMessage(messageData: CreateMessageData): Promise<Message | null> {
    try {
      const { data, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: messageData.conversation_id,
          sender_id: messageData.sender_id,
          content: messageData.content,
          message_type: messageData.message_type || 'text',
          media_url: messageData.media_url,
          reply_to_id: messageData.reply_to_id
        })
        .select()
        .single()

      if (error) {
        console.error('Error sending message:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in sendMessage:', error)
      return null
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.rpc('mark_messages_as_read', {
        conversation_id: conversationId,
        user_id: userId
      })

      if (error) {
        console.error('Error marking messages as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in markMessagesAsRead:', error)
      return false
    }
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadMessageCount(conversationId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting unread count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error in getUnreadMessageCount:', error)
      return 0
    }
  }

  /**
   * Get total unread message count for a user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      // First get conversation IDs for the user
      const { data: conversations, error: convError } = await this.supabase
        .from('conversations')
        .select('id')
        .or(`participant_1_id.eq.${userId},participant_2_id.eq.${userId}`)

      if (convError) {
        console.error('Error getting conversations:', convError)
        return 0
      }

      if (!conversations || conversations.length === 0) {
        return 0
      }

      const conversationIds = conversations.map(c => c.id)

      // Then get unread message count
      const { count, error } = await this.supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .neq('sender_id', userId)
        .eq('is_read', false)
        .in('conversation_id', conversationIds)

      if (error) {
        console.error('Error getting total unread count:', error)
        return 0
      }

      return count || 0
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
      const { error } = await this.supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', userId)

      if (error) {
        console.error('Error editing message:', error)
        return false
      }

      return true
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
      const { error } = await this.supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', userId)

      if (error) {
        console.error('Error deleting message:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteMessage:', error)
      return false
    }
  }
}

// Singleton instance
export const messageRepository = new MessageRepository()
