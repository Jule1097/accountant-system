import { NextRequest, NextResponse } from "next/server"
import { createRequestSupabaseClient } from "src/lib/integrations/supabase-server"
import { createAuthJsonResponse, resolveAuthErrorResponse } from "src/lib/helpers/auth/auth-response"
import { AuthSessionService } from "src/services/auth/AuthSession"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next()

  try {
    const payload = await request.json()
    const supabase = createRequestSupabaseClient(request, response)
    const authSessionService = new AuthSessionService()
    const user = await authSessionService.login(supabase, payload)

    return createAuthJsonResponse(response, { user })
  } catch (error: unknown) {
    const err = error as Error
    console.error("Error logging in:", err)
    return resolveAuthErrorResponse(err.message, response)
  }
}
