import { User } from "@supabase/supabase-js";
import { AuthUser } from "src/types/auth/auth";

export function mapSupabaseUserToAuthUser(user: User | null): AuthUser | null {
  if (!user?.id || !user.email) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
  };
}
