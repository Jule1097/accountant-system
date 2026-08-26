import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

function getRequiredSupabaseValue(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"): string {
  const value = name === "NEXT_PUBLIC_SUPABASE_URL"
    ? process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient(
    getRequiredSupabaseValue("NEXT_PUBLIC_SUPABASE_URL"),
    getRequiredSupabaseValue("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
  );

  return browserClient;
}
