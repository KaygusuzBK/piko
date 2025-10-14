'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { LeftSidebar } from '@/components/LeftSidebar'
import { RightSidebar } from '@/components/RightSidebar'
import { ConversationList } from '@/components/messages/ConversationList'
import { MessageThread } from '@/components/messages/MessageThread'
import { Button } from '@/components/ui/button'
import { Plus, MessageCircle } from 'lucide-react'

export default function MessagesPage() {
  const { user, loading } = useAuthStore()
  const router = useRouter()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [showNewMessage, setShowNewMessage] = useState(false)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <>
      <div className="h-screen flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 pt-4 sm:pt-6 pb-0 overflow-hidden min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 h-full min-h-0">
            <LeftSidebar />
            
            <div className="lg:col-span-2 flex flex-col min-h-0">
              {/* Messages Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5" />
                  <h1 className="text-xl font-bold">Mesajlar</h1>
                </div>
                <Button
                  onClick={() => setShowNewMessage(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Mesaj
                </Button>
              </div>

              {/* Messages Content */}
              <div className="flex-1 flex min-h-0">
                {/* Conversation List */}
                <div className="w-full lg:w-1/3 border-r">
                  <ConversationList
                    userId={user.id}
                    selectedConversationId={selectedConversationId}
                    onSelectConversation={setSelectedConversationId}
                    onNewMessage={() => setShowNewMessage(true)}
                  />
                </div>

                {/* Message Thread */}
                <div className="flex-1 lg:w-2/3">
                  {selectedConversationId ? (
                    <MessageThread
                      conversationId={selectedConversationId}
                      currentUserId={user.id}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8">
                      <div className="space-y-4">
                        <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">
                            Mesajlarınız
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            Bir konuşma seçin veya yeni bir mesaj başlatın
                          </p>
                        </div>
                        <Button
                          onClick={() => setShowNewMessage(true)}
                          className="mt-4"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Yeni Mesaj Başlat
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <RightSidebar />
          </div>
        </main>
      </div>
    </>
  )
}
