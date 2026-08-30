import { SupabaseClient } from "@supabase/supabase-js"
import { mapSupabaseUserToAuthUser } from "src/lib/helpers/auth/auth-user"
import { authLoginSchema } from "src/lib/schemas/auth/auth-schemas"
import { AuthLoginPayload, AuthUser } from "src/types/auth/auth"

type AuthSupabaseClient = Pick<SupabaseClient, "auth">

export class AuthSessionService {
  async login(supabase: AuthSupabaseClient, payload: unknown): Promise<AuthUser> {
    const parsed = authLoginSchema.safeParse(payload)

    if (!parsed.success) {
      throw new Error("Datos inválidos")
    }

    const credentials: AuthLoginPayload = parsed.data
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    const user = mapSupabaseUserToAuthUser(data.user)

    if (error || !user) {
      throw new Error("Credenciales inválidas. Por favor verifique e intente nuevamente.")
    }

    return user
  }

  async logout(supabase: AuthSupabaseClient): Promise<void> {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw new Error("Error interno del servidor")
    }
  }
}
