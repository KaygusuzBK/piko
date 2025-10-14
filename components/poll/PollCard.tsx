'use client'

import { useState } from 'react'
import { useVoteOnPoll } from '@/hooks/usePolls'
import { PollWithResults } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Users, BarChart3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface PollCardProps {
  poll: PollWithResults
  currentUserId?: string
  onVote?: () => void
}

export function PollCard({ poll, currentUserId, onVote }: PollCardProps) {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(poll.user_votes || [])
  const voteMutation = useVoteOnPoll()

  const handleOptionSelect = (optionIndex: number) => {
    if (poll.user_has_voted || poll.is_expired) return

    if (poll.allow_multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionIndex) 
          ? prev.filter(i => i !== optionIndex)
          : [...prev, optionIndex]
      )
    } else {
      setSelectedOptions([optionIndex])
    }
  }

  const handleVote = async () => {
    if (!currentUserId || selectedOptions.length === 0 || poll.user_has_voted || poll.is_expired) return

    try {
      await voteMutation.mutateAsync({
        poll_id: poll.id,
        user_id: currentUserId,
        option_indices: selectedOptions
      })
      
      onVote?.()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const formatTimeRemaining = (endDate: string) => {
    try {
      const end = new Date(endDate)
      const now = new Date()
      
      if (end <= now) return 'Süresi doldu'
      
      return formatDistanceToNow(end, { 
        addSuffix: true, 
        locale: tr 
      })
    } catch {
      return 'Geçersiz tarih'
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500'
    if (percentage >= 40) return 'bg-blue-500'
    if (percentage >= 20) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Poll Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{poll.question}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{poll.total_votes} oy</span>
                {poll.ends_at && (
                  <>
                    <span>•</span>
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeRemaining(poll.ends_at)}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              {poll.is_expired && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Süresi Doldu
                </Badge>
              )}
              {poll.allow_multiple && (
                <Badge variant="outline" className="text-xs">
                  Çoklu Seçim
                </Badge>
              )}
            </div>
          </div>

          {/* Poll Options */}
          <div className="space-y-3">
            {poll.options.map((option, index) => {
              const result = poll.results?.find(r => r.option_index === index)
              const percentage = result?.percentage || 0
              const isSelected = selectedOptions.includes(index)
              const isUserVoted = poll.user_has_voted
              const userVotedThis = poll.user_votes?.includes(index)

              return (
                <div
                  key={index}
                  className={`relative rounded-lg border-2 transition-all cursor-pointer ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : isUserVoted && userVotedThis
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-border hover:border-primary/50'
                  } ${
                    poll.user_has_voted || poll.is_expired ? 'cursor-default' : ''
                  }`}
                  onClick={() => handleOptionSelect(index)}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{option}</span>
                      <div className="flex items-center gap-2">
                        {isUserVoted && userVotedThis && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        {isUserVoted && (
                          <span className="text-sm font-medium">
                            {percentage.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {isUserVoted && (
                      <div className="space-y-1">
                        <Progress 
                          value={percentage} 
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{result?.vote_count || 0} oy</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Vote Button */}
          {!poll.user_has_voted && !poll.is_expired && currentUserId && (
            <div className="flex justify-end">
              <Button
                onClick={handleVote}
                disabled={selectedOptions.length === 0 || voteMutation.isPending}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                {voteMutation.isPending ? 'Oy Veriliyor...' : 'Oy Ver'}
              </Button>
            </div>
          )}

          {/* Poll Stats */}
          {poll.user_has_voted && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Toplam {poll.total_votes} oy</span>
                <span>{poll.options.length} seçenek</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
