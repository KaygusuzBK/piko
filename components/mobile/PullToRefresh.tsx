'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Check } from 'lucide-react'
import { usePullToRefresh } from '@/hooks/useSwipeGesture'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void
  children: React.ReactNode
  threshold?: number
  resistance?: number
  enabled?: boolean
  className?: string
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  resistance = 2.5,
  enabled = true,
  className
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [progress, setProgress] = useState(0)
  const [canRefresh, setCanRefresh] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const bind = usePullToRefresh(
    async () => {
      setIsRefreshing(true)
      setIsSuccess(false)
      
      try {
        await onRefresh()
        setIsSuccess(true)
        
        // Show success state briefly
        setTimeout(() => {
          setIsSuccess(false)
        }, 1000)
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
      }
    },
    { threshold, resistance, enabled }
  )

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const handleDrag = (event: CustomEvent) => {
      const { progress, canRefresh } = event.detail || {}
      setProgress(progress || 0)
      setCanRefresh(canRefresh || false)
    }

    element.addEventListener('drag', handleDrag)
    return () => element.removeEventListener('drag', handleDrag)
  }, [])

  return (
    <div className={cn("relative", className)}>
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {(progress > 0 || isRefreshing || isSuccess) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute top-0 left-0 right-0 z-10 flex justify-center py-4"
            style={{
              transform: `translateY(${Math.min(progress * threshold * resistance, threshold)}px)`
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <motion.div
                  animate={{
                    rotate: isRefreshing ? 360 : 0,
                    scale: canRefresh ? 1.1 : 1
                  }}
                  transition={{
                    rotate: { duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' },
                    scale: { duration: 0.2 }
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    canRefresh ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isSuccess ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </motion.div>
                
                {/* Progress ring */}
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/20"
                  style={{
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor: 'transparent'
                  }}
                  animate={{
                    borderTopColor: progress > 0.5 ? 'hsl(var(--primary))' : 'transparent',
                    borderRightColor: progress > 0.75 ? 'hsl(var(--primary))' : 'transparent',
                    borderBottomColor: progress > 0.9 ? 'hsl(var(--primary))' : 'transparent'
                  }}
                />
              </div>
              
              <motion.p
                animate={{ opacity: progress > 0.1 ? 1 : 0 }}
                className="text-xs text-muted-foreground"
              >
                {isRefreshing ? 'Yenileniyor...' : 
                 isSuccess ? 'Yenilendi!' :
                 canRefresh ? 'Bırakın' : 'Aşağı çekin'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div
        ref={containerRef}
        {...bind()}
        className="min-h-screen"
        style={{
          transform: `translateY(${Math.min(progress * threshold * resistance, threshold)}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  )
}
