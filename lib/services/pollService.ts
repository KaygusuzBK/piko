/**
 * Poll Service
 * 
 * Business logic layer for polls.
 * Handles poll creation, voting, and management.
 */

import { pollRepository } from '@/lib/repositories/pollRepository'
import type {
  Poll,
  PollResult,
  CreatePollData,
  VoteData,
  PollWithResults
} from '@/lib/types'

export class PollService {
  private pollRepo = pollRepository

  /**
   * Create a poll
   */
  async createPoll(pollData: CreatePollData): Promise<Poll | null> {
    try {
      // Validate poll data
      if (!pollData.question || pollData.question.trim().length === 0) {
        throw new Error('Poll question is required')
      }

      if (!pollData.options || pollData.options.length < 2) {
        throw new Error('Poll must have at least 2 options')
      }

      if (pollData.options.length > 10) {
        throw new Error('Poll cannot have more than 10 options')
      }

      // Validate options
      const validOptions = pollData.options.filter(option => 
        option && option.trim().length > 0
      )

      if (validOptions.length !== pollData.options.length) {
        throw new Error('All poll options must be non-empty')
      }

      // Validate end date
      if (pollData.ends_at) {
        const endDate = new Date(pollData.ends_at)
        const now = new Date()
        
        if (endDate <= now) {
          throw new Error('Poll end date must be in the future')
        }

        // Check if end date is too far in the future (max 30 days)
        const maxEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        if (endDate > maxEndDate) {
          throw new Error('Poll cannot end more than 30 days in the future')
        }
      }

      return await this.pollRepo.createPoll({
        ...pollData,
        options: validOptions
      })
    } catch (error) {
      console.error('Error in createPoll:', error)
      throw error
    }
  }

  /**
   * Get poll by ID
   */
  async getPollById(pollId: string): Promise<Poll | null> {
    try {
      return await this.pollRepo.getPollById(pollId)
    } catch (error) {
      console.error('Error in getPollById:', error)
      return null
    }
  }

  /**
   * Get poll by post ID
   */
  async getPollByPostId(postId: string): Promise<Poll | null> {
    try {
      return await this.pollRepo.getPollByPostId(postId)
    } catch (error) {
      console.error('Error in getPollByPostId:', error)
      return null
    }
  }

  /**
   * Get poll with results and user vote status
   */
  async getPollWithResults(pollId: string, userId?: string): Promise<PollWithResults | null> {
    try {
      return await this.pollRepo.getPollWithResults(pollId, userId)
    } catch (error) {
      console.error('Error in getPollWithResults:', error)
      return null
    }
  }

  /**
   * Vote on a poll
   */
  async voteOnPoll(voteData: VoteData): Promise<boolean> {
    try {
      // Validate vote data
      if (!voteData.poll_id || !voteData.user_id) {
        throw new Error('Poll ID and User ID are required')
      }

      if (!voteData.option_indices || voteData.option_indices.length === 0) {
        throw new Error('At least one option must be selected')
      }

      // Get poll to validate voting rules
      const poll = await this.pollRepo.getPollById(voteData.poll_id)
      if (!poll) {
        throw new Error('Poll not found')
      }

      // Check if poll is expired
      if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
        throw new Error('Poll has expired')
      }

      // Validate option indices
      const validIndices = voteData.option_indices.filter(index => 
        index >= 0 && index < poll.options.length
      )

      if (validIndices.length !== voteData.option_indices.length) {
        throw new Error('Invalid option selected')
      }

      // Check if multiple votes are allowed
      if (!poll.allow_multiple && validIndices.length > 1) {
        throw new Error('Multiple votes not allowed for this poll')
      }

      // Check for duplicate votes
      const uniqueIndices = [...new Set(validIndices)]
      if (uniqueIndices.length !== validIndices.length) {
        throw new Error('Duplicate votes not allowed')
      }

      return await this.pollRepo.voteOnPoll({
        ...voteData,
        option_indices: uniqueIndices
      })
    } catch (error) {
      console.error('Error in voteOnPoll:', error)
      throw error
    }
  }

  /**
   * Get poll results
   */
  async getPollResults(pollId: string): Promise<PollResult[]> {
    try {
      return await this.pollRepo.getPollResults(pollId)
    } catch (error) {
      console.error('Error in getPollResults:', error)
      return []
    }
  }

  /**
   * Check if user has voted
   */
  async hasUserVoted(pollId: string, userId: string): Promise<boolean> {
    try {
      return await this.pollRepo.hasUserVoted(pollId, userId)
    } catch (error) {
      console.error('Error in hasUserVoted:', error)
      return false
    }
  }

  /**
   * Get user's votes for a poll
   */
  async getUserVotes(pollId: string, userId: string): Promise<number[]> {
    try {
      return await this.pollRepo.getUserVotes(pollId, userId)
    } catch (error) {
      console.error('Error in getUserVotes:', error)
      return []
    }
  }

  /**
   * Update poll
   */
  async updatePoll(pollId: string, updates: Partial<CreatePollData>): Promise<boolean> {
    try {
      // Check if poll exists
      const poll = await this.pollRepo.getPollById(pollId)
      if (!poll) {
        throw new Error('Poll not found')
      }

      // Check if poll is expired
      if (poll.ends_at && new Date(poll.ends_at) < new Date()) {
        throw new Error('Cannot update expired poll')
      }

      return await this.pollRepo.updatePoll(pollId, updates)
    } catch (error) {
      console.error('Error in updatePoll:', error)
      throw error
    }
  }

  /**
   * Delete poll
   */
  async deletePoll(pollId: string): Promise<boolean> {
    try {
      return await this.pollRepo.deletePoll(pollId)
    } catch (error) {
      console.error('Error in deletePoll:', error)
      return false
    }
  }

  /**
   * Get polls by user
   */
  async getUserPolls(userId: string, limit: number = 20, offset: number = 0): Promise<Poll[]> {
    try {
      return await this.pollRepo.getUserPolls(userId, limit, offset)
    } catch (error) {
      console.error('Error in getUserPolls:', error)
      return []
    }
  }

  /**
   * Get trending polls (polls with most votes in last 24 hours)
   */
  async getTrendingPolls(limit: number = 10): Promise<PollWithResults[]> {
    try {
      // Get recent polls
      const { data, error } = await this.pollRepo.supabaseClient
        .from('polls')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(limit * 2) // Get more to filter by vote count

      if (error) {
        console.error('Error fetching trending polls:', error)
        return []
      }

      // Get results for each poll and calculate total votes
      const pollsWithResults = await Promise.all(
        (data || []).map(async (poll) => {
          const results = await this.getPollResults(poll.id)
          const totalVotes = results.reduce((sum, result) => sum + result.vote_count, 0)
          
          return {
            ...poll,
            results,
            user_has_voted: false,
            user_votes: [],
            total_votes: totalVotes,
            is_expired: poll.ends_at ? new Date(poll.ends_at) < new Date() : false
          }
        })
      )

      // Sort by total votes and return top polls
      return pollsWithResults
        .sort((a, b) => b.total_votes - a.total_votes)
        .slice(0, limit)
    } catch (error) {
      console.error('Error in getTrendingPolls:', error)
      return []
    }
  }
}

// Singleton instance
export const pollService = new PollService()
