import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Session } from '@supabase/supabase-js'
import { User as DbUser } from '@/lib/users'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  users: DbUser[]
  usersLoading: boolean
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setLoading: (loading: boolean) => void
  setUsers: (users: DbUser[]) => void
  setUsersLoading: (loading: boolean) => void
  signOut: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      loading: true,
      users: [],
      usersLoading: false,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setUsers: (users) => set({ users }),
      setUsersLoading: (usersLoading) => set({ usersLoading }),
      signOut: () => set({ user: null, session: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        session: state.session 
      }),
    }
  )
)
