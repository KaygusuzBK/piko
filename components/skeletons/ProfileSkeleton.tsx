import { Skeleton } from '@/components/ui/skeleton'

export function ProfileSkeleton({ isCompact = false }: { isCompact?: boolean }) {
  return (
    <div className={`transition-all duration-300 ${isCompact ? 'pb-2' : 'pb-4'}`}>
      {/* Banner skeleton */}
      <div className="relative group">
        <Skeleton
          className={`w-full rounded-lg ${
            isCompact ? 'h-20 sm:h-24' : 'h-32 sm:h-40 lg:h-48'
          }`}
        />
      </div>

      {/* Profile info skeleton */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="flex items-end gap-4">
          {/* Avatar skeleton */}
          <Skeleton className="h-16 w-16 rounded-full border-4 border-background" />
          
          <div className="flex-1 pb-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Bio skeleton */}
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* Stats skeleton */}
        <div className="flex gap-6 mt-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}
