import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PostSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar skeleton */}
          <Skeleton className="h-10 w-10 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* Header skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            
            {/* Content skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            
            {/* Image skeleton */}
            <Skeleton className="h-48 w-full rounded-lg" />
            
            {/* Actions skeleton */}
            <div className="flex justify-between pt-2">
              <div className="flex gap-6">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function FeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </div>
  )
}
