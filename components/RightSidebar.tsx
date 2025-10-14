'use client'

import { useAuthStore } from '@/stores/authStore'
import { FollowSuggestions } from '@/components/FollowSuggestions'
import { TrendingHashtags } from '@/components/TrendingHashtags'

export function RightSidebar() {
  const { user } = useAuthStore()

  return (
    <div className="hidden md:block lg:col-span-1">
      <div className="sticky top-6 space-y-4">
        <TrendingHashtags limit={5} />
        <FollowSuggestions currentUserId={user?.id} limit={5} />
      </div>
    </div>
  )
}


