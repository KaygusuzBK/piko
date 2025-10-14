'use client'

import { useState, useEffect, useRef } from 'react'
import { useConversationMessages, useSendMessage, useMarkAsRead } from '@/hooks/useMessages'
import { MessageWithSender } from '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, MoreVertical, Reply, Edit, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
}

export function MessageThread({ conversationId, currentUserId }: MessageThreadProps) {
  const [message, setMessage] = useState('')
  const [replyingTo, setReplyingTo] = useState<MessageWithSender | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const { data: messages = [], isLoading } = useConversationMessages(conversationId)
  const sendMessageMutation = useSendMessage()
  const markAsReadMutation = useMarkAsRead()

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      markAsReadMutation.mutate({ conversationId, userId: currentUserId })
    }
  }, [conversationId, messages.length, currentUserId])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return

    try {
      await sendMessageMutation.mutateAsync({
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: message.trim(),
        reply_to_id: replyingTo?.id
      })
      
      setMessage('')
      setReplyingTo(null)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageTime = (dateString: string) => {
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

  return (
    <div className="h-full flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>Henüz mesaj yok</p>
              <p className="text-sm">İlk mesajınızı gönderin!</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwnMessage = msg.sender_id === currentUserId
            
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.sender?.avatar_url} />
                  <AvatarFallback>
                    {msg.sender?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'text-right' : ''}`}>
                  {/* Reply indicator */}
                  {msg.reply_to && (
                    <div className="mb-2 p-2 bg-muted rounded-lg text-xs">
                      <p className="font-medium">{msg.reply_to.sender?.name}</p>
                      <p className="text-muted-foreground truncate">
                        {msg.reply_to.content}
                      </p>
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div className={`inline-block p-3 rounded-lg ${
                    isOwnMessage 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    {msg.is_edited && (
                      <p className="text-xs opacity-70 mt-1">(düzenlendi)</p>
                    )}
                  </div>
                  
                  {/* Message info */}
                  <div className={`flex items-center gap-2 mt-1 text-xs text-muted-foreground ${
                    isOwnMessage ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>{formatMessageTime(msg.created_at)}</span>
                    {isOwnMessage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setReplyingTo(msg)}>
                            <Reply className="h-4 w-4 mr-2" />
                            Yanıtla
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Düzenle
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply indicator */}
      {replyingTo && (
        <div className="p-3 bg-muted border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{replyingTo.sender?.name}</span>
              <span className="text-muted-foreground ml-2">
                {replyingTo.content}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(null)}
            >
              ✕
            </Button>
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesajınızı yazın..."
            className="flex-1 min-h-[40px] max-h-[120px] resize-none"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
