"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, DecodedToken } from "@/types";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from "@/lib/authUtils";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


const ADMIN_CONFIG_KEY = "admin_email";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    async function loadAdminEmail() {
      try {
        const res = await fetch(`/api/config?key=${ADMIN_CONFIG_KEY}`);
        if (res.ok) {
          const data = await res.json();
          setAdminEmail(data.value || "");
        }
      } catch (e) {
        console.error("Failed to load admin email", e);
      }
    }
    loadAdminEmail();
  }, []);

  const decodeAndSetUser = useCallback(
    (token: string) => {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        const currentUser = {
          userId: decodedToken.userId,
          email: decodedToken.email,
        };
        setUser(currentUser);
        setIsAuthenticated(true);
        if (adminEmail && currentUser.email === adminEmail) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
        return currentUser;
      } catch (error) {
        console.error("Failed to decode token:", error);
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
        return null;
      }
    },
    [adminEmail]
  );

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const accessToken = Cookies.get(ACCESS_TOKEN_NAME);
    if (accessToken) {
      decodeAndSetUser(accessToken);
    } else {
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
    }
    setIsLoading(false);
  }, [decodeAndSetUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const token = Cookies.get(ACCESS_TOKEN_NAME);
    if (token && adminEmail) {
      decodeAndSetUser(token);
    }
  }, [adminEmail, decodeAndSetUser]);

  const login = (accessToken: string, refreshToken: string) => {
    Cookies.set(ACCESS_TOKEN_NAME, accessToken, {
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    Cookies.set(REFRESH_TOKEN_NAME, refreshToken, {
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
    const loggedInUser = decodeAndSetUser(accessToken);
    if (loggedInUser && adminEmail && loggedInUser.email === adminEmail) {
      router.push("/admin/dashboard"); // Redirect admin to dashboard
    } else {
      router.push("/room-entry");
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      // Logging of logout success/failure should be in the API route itself.
    } catch (error) {
      console.error("Logout API call failed:", error);
      // Client-side log if needed, but server should log API errors
    } finally {
      Cookies.remove(ACCESS_TOKEN_NAME, { path: "/" });
      Cookies.remove(REFRESH_TOKEN_NAME, { path: "/" });
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsLoading(false);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isAdmin,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
