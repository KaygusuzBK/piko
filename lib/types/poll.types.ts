export interface Poll {
  id: string
  post_id: string
  question: string
  options: string[]
  allow_multiple: boolean
  ends_at?: string
  is_anonymous: boolean
  created_at: string
  updated_at: string
}

export interface PollVote {
  id: string
  poll_id: string
  user_id: string
  option_index: number
  created_at: string
}

export interface PollResult {
  option_index: number
  option_text: string
  vote_count: number
  percentage: number
}

export interface CreatePollData {
  post_id: string
  question: string
  options: string[]
  allow_multiple?: boolean
  ends_at?: string
  is_anonymous?: boolean
}

export interface VoteData {
  poll_id: string
  user_id: string
  option_indices: number[]
}

export interface PollWithResults extends Poll {
  results?: PollResult[]
  user_has_voted: boolean
  user_votes?: number[]
  total_votes: number
  is_expired: boolean
}
