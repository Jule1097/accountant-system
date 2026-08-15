import { NextRequest, NextResponse } from "next/server";
import { createRequestSupabaseClient } from "src/lib/supabase-server";

export async function getParserAuthenticatedUserId(request: NextRequest): Promise<string> {
  const response = NextResponse.next();
  const supabase = createRequestSupabaseClient(request, response);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user.id;
}
