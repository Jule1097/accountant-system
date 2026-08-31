import { Dispatch, SetStateAction, useContext } from "react";
import { AuthContext } from "src/contexts/auth-context";
import { apiRequest } from "src/lib/api/api-client";
import { AuthContextType, AuthLoginResponse, UseAuthResult } from "src/types/auth/auth";

export function useAuth(): UseAuthResult {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function useAuthActions(
  setUser: Dispatch<SetStateAction<AuthContextType["user"]>>,
  setLoading: Dispatch<SetStateAction<boolean>>
): Pick<UseAuthResult, "login" | "logout"> {
  const login = async (email: string, password: string): Promise<void> => {
    const response = await apiRequest("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });
    const data = await response.json() as AuthLoginResponse;

    setUser(data.user);
    setLoading(false);
  };

  const logout = async (): Promise<void> => {
    await apiRequest("/api/auth/logout", {
      method: "POST",
    });

    setUser(null);
    setLoading(false);
  };

  return {
    login,
    logout,
  };
}
