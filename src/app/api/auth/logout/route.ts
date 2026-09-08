import { NextRequest, NextResponse } from "next/server"
import { createRequestSupabaseClient } from "src/lib/integrations/supabase-server"
import { createAuthJsonResponse, resolveAuthErrorResponse } from "src/lib/helpers/auth/auth-response"
import { AuthSessionService } from "src/services/auth/AuthSession"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const response = NextResponse.next()

  try {
    const supabase = createRequestSupabaseClient(request, response)
    const authSessionService = new AuthSessionService()

    await authSessionService.logout(supabase)

    return createAuthJsonResponse(response, { success: true })
  } catch (error) {
    console.error("Authentication logout failed", { path: request.nextUrl.pathname, operation: "logout", errorName: error instanceof Error ? error.name : "UnknownError" })
    return resolveAuthErrorResponse(error, response)
  }
}
