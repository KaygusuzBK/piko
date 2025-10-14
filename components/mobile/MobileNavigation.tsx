'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Home, 
  Search, 
  MessageCircle, 
  Bell, 
  User, 
  Plus,
  Settings,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MobileNavigationProps {
  className?: string
}

const navigationItems = [
  { path: '/', icon: Home, label: 'Ana Sayfa' },
  { path: '/search', icon: Search, label: 'Ara' },
  { path: '/messages', icon: MessageCircle, label: 'Mesajlar' },
  { path: '/notifications', icon: Bell, label: 'Bildirimler' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/settings', icon: Settings, label: 'Ayarlar' },
]

export function MobileNavigation({ className }: MobileNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show navigation on mobile devices
    const checkMobile = () => {
      setIsVisible(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavigation = (path: string) => {
    router.push(path)
  }

  const handleCreatePost = () => {
    // Scroll to top and focus on create post
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // You could also trigger a create post modal here
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border",
          className
        )}
      >
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Navigation Items */}
            <div className="flex items-center gap-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.path
                const Icon = item.icon

                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      "flex-1 h-12 flex-col gap-1 p-2",
                      isActive && "text-primary"
                    )}
                  >
                    <Icon className={cn(
                      "h-5 w-5",
                      isActive && "text-primary"
                    )} />
                    <span className="text-xs">{item.label}</span>
                  </Button>
                )
              })}
            </div>

            {/* Create Post Button */}
            <Button
              onClick={handleCreatePost}
              className="ml-2 h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Hook for mobile navigation state
export function useMobileNavigation() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsVisible(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return { isVisible }
}
