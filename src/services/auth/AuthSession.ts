import { SupabaseClient } from "@supabase/supabase-js"
import { apiResponseMessages } from "src/lib/constants/api-response"
import { applicationErrorCodes } from "src/lib/constants/application-error"
import { ApplicationError } from "src/lib/errors/application-error"
import { mapSupabaseUserToAuthUser } from "src/lib/helpers/auth/auth-user"
import { authLoginSchema } from "src/lib/schemas/auth/auth-schemas"
import { AuthLoginPayload, AuthUser } from "src/types/auth/auth"

type AuthSupabaseClient = Pick<SupabaseClient, "auth">
const invalidCredentialsMessage = "Credenciales inv\u00e1lidas. Por favor verifique e intente nuevamente."

export class AuthSessionService {
  async login(supabase: AuthSupabaseClient, payload: unknown): Promise<AuthUser> {
    const parsed = authLoginSchema.safeParse(payload)
    if (!parsed.success) throw new ApplicationError(applicationErrorCodes.validation, apiResponseMessages.common.invalidData, "Authentication payload validation failed")
    const credentials: AuthLoginPayload = parsed.data
    const { data, error } = await supabase.auth.signInWithPassword(credentials)
    const user = mapSupabaseUserToAuthUser(data.user)
    if (error || !user) throw new ApplicationError(applicationErrorCodes.unauthenticated, invalidCredentialsMessage, "Authentication credentials rejected")
    return user
  }

  async logout(supabase: AuthSupabaseClient): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw new ApplicationError(applicationErrorCodes.unexpected, apiResponseMessages.common.internalServerError, "Authentication logout failed")
  }
}
