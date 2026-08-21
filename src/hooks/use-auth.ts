import { useEffect, useState } from "react";
import { User, AuthResponse } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "src/lib/supabase-client";
import { UseAuthResult } from "src/types/auth";

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse['data']> => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    loading,
    login,
    logout
  };
}
