/**
 * Poll Repository
 * 
 * Data access layer for polls and poll votes.
 * Handles all database operations related to polls.
 */

import { createClient } from '@/lib/supabase'
import type { 
  Poll,
  PollVote,
  PollResult,
  CreatePollData,
  VoteData,
  PollWithResults
} from '@/lib/types'

export class PollRepository {
  private supabase = createClient()
  
  // Expose supabase for service layer
  get supabaseClient() {
    return this.supabase
  }

  /**
   * Create a new poll
   */
  async createPoll(pollData: CreatePollData): Promise<Poll | null> {
    try {
      const { data, error } = await this.supabase
        .from('polls')
        .insert({
          post_id: pollData.post_id,
          question: pollData.question,
          options: pollData.options,
          allow_multiple: pollData.allow_multiple || false,
          ends_at: pollData.ends_at,
          is_anonymous: pollData.is_anonymous || false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating poll:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createPoll:', error)
      return null
    }
  }

  /**
   * Get poll by ID
   */
  async getPollById(pollId: string): Promise<Poll | null> {
    try {
      const { data, error } = await this.supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single()

      if (error) {
        console.error('Error fetching poll:', error)
        return null
      }

      return data
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
      const { data, error } = await this.supabase
        .from('polls')
        .select('*')
        .eq('post_id', postId)
        .single()

      if (error) {
        console.error('Error fetching poll by post ID:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getPollByPostId:', error)
      return null
    }
  }

  /**
   * Get poll results
   */
  async getPollResults(pollId: string): Promise<PollResult[]> {
    try {
      const { data, error } = await this.supabase.rpc('get_poll_results', {
        poll_id: pollId
      })

      if (error) {
        console.error('Error fetching poll results:', error)
        return []
      }

      return data || []
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
      const { data, error } = await this.supabase.rpc('has_user_voted', {
        poll_id: pollId,
        user_id: userId
      })

      if (error) {
        console.error('Error checking if user voted:', error)
        return false
      }

      return data || false
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
      const { data, error } = await this.supabase.rpc('get_user_votes', {
        poll_id: pollId,
        user_id: userId
      })

      if (error) {
        console.error('Error fetching user votes:', error)
        return []
      }

      return (data || []).map((vote: { option_index: number }) => vote.option_index)
    } catch (error) {
      console.error('Error in getUserVotes:', error)
      return []
    }
  }

  /**
   * Vote on a poll
   */
  async voteOnPoll(voteData: VoteData): Promise<boolean> {
    try {
      // First, remove existing votes for this user and poll
      await this.supabase
        .from('poll_votes')
        .delete()
        .eq('poll_id', voteData.poll_id)
        .eq('user_id', voteData.user_id)

      // Insert new votes
      const votes = voteData.option_indices.map(optionIndex => ({
        poll_id: voteData.poll_id,
        user_id: voteData.user_id,
        option_index: optionIndex
      }))

      const { error } = await this.supabase
        .from('poll_votes')
        .insert(votes)

      if (error) {
        console.error('Error voting on poll:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in voteOnPoll:', error)
      return false
    }
  }

  /**
   * Get poll with results and user vote status
   */
  async getPollWithResults(pollId: string, userId?: string): Promise<PollWithResults | null> {
    try {
      const poll = await this.getPollById(pollId)
      if (!poll) return null

      const results = await this.getPollResults(pollId)
      const userHasVoted = userId ? await this.hasUserVoted(pollId, userId) : false
      const userVotes = userId ? await this.getUserVotes(pollId, userId) : []
      
      const totalVotes = results.reduce((sum, result) => sum + result.vote_count, 0)
      const isExpired = poll.ends_at ? new Date(poll.ends_at) < new Date() : false

      return {
        ...poll,
        results,
        user_has_voted: userHasVoted,
        user_votes: userVotes,
        total_votes: totalVotes,
        is_expired: isExpired
      }
    } catch (error) {
      console.error('Error in getPollWithResults:', error)
      return null
    }
  }

  /**
   * Update poll
   */
  async updatePoll(pollId: string, updates: Partial<CreatePollData>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('polls')
        .update({
          question: updates.question,
          options: updates.options,
          allow_multiple: updates.allow_multiple,
          ends_at: updates.ends_at,
          is_anonymous: updates.is_anonymous,
          updated_at: new Date().toISOString()
        })
        .eq('id', pollId)

      if (error) {
        console.error('Error updating poll:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in updatePoll:', error)
      return false
    }
  }

  /**
   * Delete poll
   */
  async deletePoll(pollId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('polls')
        .delete()
        .eq('id', pollId)

      if (error) {
        console.error('Error deleting poll:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deletePoll:', error)
      return false
    }
  }

  /**
   * Get polls by user (polls in user's posts)
   */
  async getUserPolls(userId: string, limit: number = 20, offset: number = 0): Promise<Poll[]> {
    try {
      const { data, error } = await this.supabase
        .from('polls')
        .select(`
          *,
          post:posts!polls_post_id_fkey (
            author_id
          )
        `)
        .eq('post.author_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching user polls:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Error in getUserPolls:', error)
      return []
    }
  }
}

// Singleton instance
export const pollRepository = new PollRepository()
