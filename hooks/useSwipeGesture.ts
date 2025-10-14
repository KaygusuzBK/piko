import { useRef, useCallback } from 'react'
import { useGesture } from '@use-gesture/react'

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
  velocityThreshold?: number
  preventDefault?: boolean
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocityThreshold = 0.3,
    preventDefault = true
  } = options

  const bind = useGesture(
    {
      onDragEnd: ({ direction, velocity, movement, event }) => {
        const [x, y] = direction
        const [vx, vy] = velocity
        const [mx, my] = movement

        if (preventDefault) {
          event.preventDefault()
        }

        // Check horizontal swipes
        if (Math.abs(mx) > threshold && Math.abs(vx) > velocityThreshold) {
          if (x > 0 && onSwipeRight) {
            onSwipeRight()
          } else if (x < 0 && onSwipeLeft) {
            onSwipeLeft()
          }
        }

        // Check vertical swipes
        if (Math.abs(my) > threshold && Math.abs(vy) > velocityThreshold) {
          if (y > 0 && onSwipeDown) {
            onSwipeDown()
          } else if (y < 0 && onSwipeUp) {
            onSwipeUp()
          }
        }
      }
    },
    {
      drag: {
        threshold: 10,
        axis: undefined, // Allow both horizontal and vertical
        lockDirection: false
      }
    }
  )

  return bind
}

// Hook for pull-to-refresh functionality
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options: {
    threshold?: number
    resistance?: number
    enabled?: boolean
  } = {}
) {
  const {
    threshold = 80,
    resistance = 2.5,
    enabled = true
  } = options

  const bind = useGesture(
    {
      onDrag: ({ active, movement: [, my], memo = { refreshing: false } }) => {
        if (!enabled || memo.refreshing) return memo

        const progress = Math.min(my / threshold, 1)
        
        return {
          ...memo,
          progress,
          canRefresh: my > threshold
        }
      },
      onDragEnd: async ({ movement: [, my], memo = { refreshing: false } }) => {
        if (!enabled || memo.refreshing) return memo

        if (my > threshold) {
          memo.refreshing = true
          try {
            await onRefresh()
          } finally {
            memo.refreshing = false
          }
        }

        return memo
      }
    },
    {
      drag: {
        axis: 'y',
        filterTaps: true,
        threshold: 10
      }
    }
  )

  return bind
}

// Hook for swipe-to-delete functionality
export function useSwipeToDelete(
  onDelete: () => void,
  options: {
    threshold?: number
    deleteThreshold?: number
    resistance?: number
  } = {}
) {
  const {
    threshold = 100,
    deleteThreshold = 200,
    resistance = 2.5
  } = options

  const bind = useGesture(
    {
      onDrag: ({ active, movement: [mx], memo = { deleting: false } }) => {
        if (memo.deleting) return memo

        const progress = Math.min(Math.abs(mx) / threshold, 1)
        const deleteProgress = Math.min(Math.abs(mx) / deleteThreshold, 1)
        
        return {
          ...memo,
          progress,
          deleteProgress,
          canDelete: Math.abs(mx) > deleteThreshold
        }
      },
      onDragEnd: ({ movement: [mx], memo = { deleting: false } }) => {
        if (memo.deleting) return memo

        if (Math.abs(mx) > deleteThreshold) {
          memo.deleting = true
          onDelete()
        }

        return memo
      }
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
        threshold: 10
      }
    }
  )

  return bind
}

// Hook for swipe-to-reveal functionality
export function useSwipeToReveal(
  onReveal: () => void,
  options: {
    threshold?: number
    resistance?: number
  } = {}
) {
  const {
    threshold = 100,
    resistance = 2.5
  } = options

  const bind = useGesture(
    {
      onDrag: ({ active, movement: [mx], memo = { revealed: false } }) => {
        const progress = Math.min(Math.abs(mx) / threshold, 1)
        
        return {
          ...memo,
          progress,
          canReveal: Math.abs(mx) > threshold
        }
      },
      onDragEnd: ({ movement: [mx], memo = { revealed: false } }) => {
        if (Math.abs(mx) > threshold && !memo.revealed) {
          memo.revealed = true
          onReveal()
        }

        return memo
      }
    },
    {
      drag: {
        axis: 'x',
        filterTaps: true,
        threshold: 10
      }
    }
  )

  return bind
}
