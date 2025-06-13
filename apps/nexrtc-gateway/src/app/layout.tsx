import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/Toaster"; // Simple toast component
import "./globals.css"; // Global styles
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
      <body
        className={`${inter.className} bg-background text-text min-h-screen flex flex-col`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
