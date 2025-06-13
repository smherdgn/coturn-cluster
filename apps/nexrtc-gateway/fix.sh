# Layout'u AuthProvider olmadan test et
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextRTC Video Call",
  description: "Secure WebRTC video calling application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text min-h-screen flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
EOF

# Test et
next build

# Eğer çalışırsa AuthProvider'daki useRouter'ı düzelt
cat > src/contexts/AuthContext.tsx << 'EOF'
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

  // Router navigation'ı client-side için guard ekle
  const safeNavigate = useCallback((path: string) => {
    if (typeof window !== 'undefined') {
      router.push(path);
    }
  }, [router]);

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
    if (typeof window !== 'undefined') {
      const accessToken = Cookies.get(ACCESS_TOKEN_NAME);
      if (accessToken) {
        decodeAndSetUser(accessToken);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    }
    setIsLoading(false);
  }, [decodeAndSetUser]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = Cookies.get(ACCESS_TOKEN_NAME);
      if (token && adminEmail) {
        decodeAndSetUser(token);
      }
    }
  }, [adminEmail, decodeAndSetUser]);

  const login = (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
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
        safeNavigate("/admin/dashboard");
      } else {
        safeNavigate("/room-entry");
      }
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      if (typeof window !== 'undefined') {
        Cookies.remove(ACCESS_TOKEN_NAME, { path: "/" });
        Cookies.remove(REFRESH_TOKEN_NAME, { path: "/" });
      }
      setUser(null);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setIsLoading(false);
      safeNavigate("/login");
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
EOF

# Layout'u geri ekle
cat > src/app/layout.tsx << 'EOF'
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/Toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextRTC Video Call",
  description: "Secure WebRTC video calling application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-background text-text min-h-screen flex flex-col`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
EOF

# Final test
next build