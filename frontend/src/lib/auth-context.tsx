"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfile, api, setStoredToken, clearStoredToken, getStoredToken } from "./api";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (user: UserProfile, token?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isRider: boolean;
  isManager: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
      clearStoredToken();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if token or cookie exists
    const token = getStoredToken();
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newUser: UserProfile, token?: string) => {
    if (token) {
      setStoredToken(token);
    }
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearStoredToken();
      setUser(null);
      router.push("/login");
    }
  };

  const isRider = user?.role === "rider";
  const isManager = user?.role === "manager" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        isRider,
        isManager,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
