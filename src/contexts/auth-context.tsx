"use client";

import { createContext, ReactNode, useEffect, useState } from "react";
import { useAuthActions } from "src/hooks/auth/use-auth";
import { getSupabaseBrowserClient } from "src/lib/integrations/supabase-client";
import { mapSupabaseUserToAuthUser } from "src/lib/helpers/auth/auth-user";
import { AuthContextType } from "src/types/auth/auth";

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const { login, logout } = useAuthActions(setUser, setLoading);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const loadUser = async (): Promise<void> => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setUser(mapSupabaseUserToAuthUser(currentUser));
      setLoading(false);
    };

    void loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      setUser(mapSupabaseUserToAuthUser(session?.user ?? null));
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
