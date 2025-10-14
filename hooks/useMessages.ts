import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { messageService } from '@/lib/services/messageService'
import { queryKeys } from '@/lib/utils/queryClient'
import type { 
  ConversationWithParticipants, 
  MessageWithSender, 
  CreateMessageData 
} from '@/lib/types'

/**
 * Hook for managing user conversations
 */
export function useConversations(userId?: string) {
  return useQuery({
    queryKey: queryKeys.conversations.user(userId!),
    queryFn: () => messageService.getUserConversations(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Hook for managing conversation messages
 */
export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: queryKeys.messages.conversation(conversationId!),
    queryFn: () => messageService.getConversationMessages(conversationId!),
    enabled: !!conversationId,
    staleTime: 10 * 1000, // 10 seconds
  })
}

/**
 * Hook for sending messages
 */
export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (messageData: CreateMessageData) => {
      return messageService.sendTextMessage(
        messageData.conversation_id,
        messageData.sender_id,
        messageData.content,
        messageData.reply_to_id
      )
    },
    onSuccess: (newMessage, variables) => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversations.user(variables.sender_id) 
      })
      
      // Invalidate and refetch messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages.conversation(variables.conversation_id) 
      })
    },
  })
}

/**
 * Hook for sending media messages
 */
export function useSendMediaMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      conversationId: string
      senderId: string
      content: string
      mediaUrl: string
      messageType: 'image' | 'video' | 'file'
      replyToId?: string
    }) => {
      return messageService.sendMediaMessage(
        data.conversationId,
        data.senderId,
        data.content,
        data.mediaUrl,
        data.messageType,
        data.replyToId
      )
    },
    onSuccess: (newMessage, variables) => {
      // Invalidate and refetch conversations
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversations.user(variables.senderId) 
      })
      
      // Invalidate and refetch messages for this conversation
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages.conversation(variables.conversationId) 
      })
    },
  })
}

/**
 * Hook for starting a conversation
 */
export function useStartConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ user1Id, user2Id }: { user1Id: string; user2Id: string }) => {
      return messageService.startConversation(user1Id, user2Id)
    },
    onSuccess: (conversationId, variables) => {
      // Invalidate conversations for both users
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversations.user(variables.user1Id) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversations.user(variables.user2Id) 
      })
    },
  })
}

/**
 * Hook for marking messages as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      userId 
    }: { 
      conversationId: string
      userId: string 
    }) => {
      return messageService.markAsRead(conversationId, userId)
    },
    onSuccess: (_, variables) => {
      // Invalidate conversations to update unread counts
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.conversations.user(variables.userId) 
      })
    },
  })
}

/**
 * Hook for getting unread message count
 */
export function useUnreadMessageCount(userId?: string) {
  return useQuery({
    queryKey: queryKeys.messages.unreadCount(userId!),
    queryFn: () => messageService.getTotalUnreadCount(userId!),
    enabled: !!userId,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  })
}

/**
 * Hook for editing messages
 */
export function useEditMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      content, 
      userId 
    }: { 
      messageId: string
      content: string
      userId: string 
    }) => {
      return messageService.editMessage(messageId, content, userId)
    },
    onSuccess: (_, variables) => {
      // Invalidate messages to show updated content
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages.all 
      })
    },
  })
}

/**
 * Hook for deleting messages
 */
export function useDeleteMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      messageId, 
      userId 
    }: { 
      messageId: string
      userId: string 
    }) => {
      return messageService.deleteMessage(messageId, userId)
    },
    onSuccess: (_, variables) => {
      // Invalidate messages to remove deleted message
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.messages.all 
      })
    },
  })
}
