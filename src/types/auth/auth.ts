import { User, AuthResponse } from '@supabase/supabase-js'

export interface UseAuthResult {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResponse['data']>
  logout: () => Promise<void>
}
