import type { User } from './user.types'

export interface Conversation {
  id: string
  participant_1_id: string
  participant_2_id: string
  last_message_at: string
  created_at: string
  updated_at: string
  participant_1?: User
  participant_2?: User
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  message_type: 'text' | 'image' | 'video' | 'file'
  media_url?: string
  is_read: boolean
  is_edited: boolean
  reply_to_id?: string
  created_at: string
  updated_at: string
  sender?: User
  reply_to?: Message
}

export interface CreateMessageData {
  conversation_id: string
  sender_id: string
  content: string
  message_type?: 'text' | 'image' | 'video' | 'file'
  media_url?: string
  reply_to_id?: string
}

export interface ConversationWithParticipants extends Conversation {
  participant_1: User
  participant_2: User
  last_message?: Message
  unread_count: number
}

export interface MessageWithSender extends Message {
  sender: User
  reply_to?: MessageWithSender
}
