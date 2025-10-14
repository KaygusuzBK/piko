'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  snapPoints?: number[]
  defaultSnap?: number
  showCloseButton?: boolean
  showDragHandle?: boolean
  enablePanToClose?: boolean
  maxHeight?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  className,
  snapPoints = [0.5, 0.9],
  defaultSnap = 0,
  showCloseButton = true,
  showDragHandle = true,
  enablePanToClose = true,
  maxHeight = '90vh'
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap)
  const [isDragging, setIsDragging] = useState(false)
  const constraintsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    
    const threshold = 50
    const velocity = info.velocity.y
    const offset = info.offset.y

    // Close if dragged down significantly
    if (enablePanToClose && (offset > threshold || velocity > 500)) {
      onClose()
      return
    }

    // Snap to nearest snap point
    const snapIndex = snapPoints.findIndex((snap, index) => {
      const nextSnap = snapPoints[index + 1]
      if (!nextSnap) return true
      return Math.abs(offset) < (snap - nextSnap) / 2
    })

    setCurrentSnap(snapIndex >= 0 ? snapIndex : 0)
  }

  const handleSnapTo = (index: number) => {
    setCurrentSnap(index)
  }

  const currentHeight = snapPoints[currentSnap] * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={constraintsRef}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-xl shadow-lg",
              className
            )}
            style={{ maxHeight }}
            initial={{ y: '100%' }}
            animate={{ 
              y: `${100 - currentHeight}%`,
              transition: { type: 'spring', damping: 30, stiffness: 300 }
            }}
            exit={{ 
              y: '100%',
              transition: { duration: 0.2 }
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            dragMomentum={false}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                {showDragHandle && (
                  <div className="w-8 h-1 bg-muted rounded-full" />
                )}
                {title && (
                  <h3 className="text-lg font-semibold">{title}</h3>
                )}
              </div>
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Snap Points Indicator */}
            {snapPoints.length > 1 && (
              <div className="flex justify-center py-2 border-b border-border">
                <div className="flex gap-1">
                  {snapPoints.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleSnapTo(index)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        index === currentSnap ? "bg-primary" : "bg-muted"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto" style={{ height: `${currentHeight}vh` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for managing bottom sheet state
export function useBottomSheet(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  return {
    isOpen,
    open,
    close,
    toggle
  }
}
