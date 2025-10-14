'use client'

import { useState } from 'react'
import { useConversations } from '@/hooks/useMessages'
import { ConversationWithParticipants } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MessageCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface ConversationListProps {
  userId: string
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewMessage: () => void
}

export function ConversationList({
  userId,
  selectedConversationId,
  onSelectConversation,
  onNewMessage
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: conversations = [], isLoading, error } = useConversations(userId)

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true
    
    const otherParticipant = conv.participant_1_id === userId 
      ? conv.participant_2 
      : conv.participant_1
    
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherParticipant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const getOtherParticipant = (conversation: ConversationWithParticipants) => {
    return conversation.participant_1_id === userId 
      ? conversation.participant_2 
      : conversation.participant_1
  }

  const formatLastMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: tr 
      })
    } catch {
      return 'Şimdi'
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Mesajlar yüklenirken hata oluştu</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Konuşma ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center text-muted-foreground">
              <MessageCircle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">
                {searchQuery ? 'Arama sonucu bulunamadı' : 'Henüz mesajınız yok'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={onNewMessage}
                  size="sm"
                  className="mt-2"
                >
                  İlk Mesajınızı Gönderin
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredConversations.map((conversation) => {
              const otherParticipant = getOtherParticipant(conversation)
              const isSelected = selectedConversationId === conversation.id
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                    isSelected ? 'bg-muted border-r-2 border-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={otherParticipant?.avatar_url} />
                      <AvatarFallback>
                        {otherParticipant?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm truncate">
                          {otherParticipant?.name || 'Bilinmeyen Kullanıcı'}
                        </h3>
                        {conversation.unread_count > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">
                            {conversation.unread_count}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {conversation.last_message?.content || 'Henüz mesaj yok'}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatLastMessageTime(conversation.last_message_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
