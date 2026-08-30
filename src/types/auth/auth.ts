export interface AuthUser {
  id: string
  email: string
}

export interface AuthLoginPayload {
  email: string
  password: string
}

export interface AuthLoginResponse {
  user: AuthUser
}

export interface AuthLogoutResponse {
  success: true
}

export interface UseAuthResult {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export type AuthContextType = UseAuthResult
