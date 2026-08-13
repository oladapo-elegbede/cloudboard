"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  loginUser as apiLoginUser,
  logoutUser as apiLogoutUser,
  registerUser as apiRegisterUser,
  refreshSession,
  getCurrentUser,
  type PublicUser,
  type LoginCredentials,
  type RegisterCredentials,
} from "../lib/auth-api";
import { ApiError } from "../lib/api-client";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  accessToken: string | null;
  register: (credentials: RegisterCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const setAuthenticated = useCallback((newUser: PublicUser, newAccessToken: string) => {
    setUser(newUser);
    setAccessToken(newAccessToken);
    setStatus("authenticated");
  }, []);

  const setUnauthenticated = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setStatus("unauthenticated");
  }, []);

  useEffect(() => {
    const attemptSilentRefresh = async () => {
      try {
        const { accessToken: newAccessToken } = await refreshSession();
        const { user: currentUser } = await getCurrentUser(newAccessToken);
        setAuthenticated(currentUser, newAccessToken);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          setUnauthenticated();
          return;
        }
        console.error("Silent refresh failed unexpectedly:", error);
        setUnauthenticated();
      }
    };

    attemptSilentRefresh();
  }, [setAuthenticated, setUnauthenticated]);

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<void> => {
      const { user: newUser, accessToken: newAccessToken } = await apiRegisterUser(credentials);
      setAuthenticated(newUser, newAccessToken);
    },
    [setAuthenticated],
  );

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      const { user: loggedInUser, accessToken: newAccessToken } = await apiLoginUser(credentials);
      setAuthenticated(loggedInUser, newAccessToken);
    },
    [setAuthenticated],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiLogoutUser();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      setUnauthenticated();
    }
  }, [setUnauthenticated]);

  const value: AuthContextValue = {
    status,
    user,
    accessToken,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
