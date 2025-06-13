
"use client";
import React, { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { showToast } from '@/components/ui/Toaster';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      router.replace('/room-entry');
    }
  }, [authIsLoading, isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const { accessToken, refreshToken } = await response.json();
        login(accessToken, refreshToken); // AuthContext handles redirect
        showToast('Login successful!', 'success');
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed. Please check your credentials.');
        showToast(data.message || 'Login failed.', 'error');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
      showToast('An unexpected error occurred.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authIsLoading) {
     return <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-text text-xl">Loading...</p></div>;
  }
  if (isAuthenticated) { // Should be caught by useEffect, but as a safeguard
    return null; // Or a loading spinner while redirecting
  }


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-slate-900 to-background p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-card shadow-xl rounded-lg border border-border">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-text">Welcome to NextRTC</h1>
          <p className="text-text-muted">Sign in to start your video call</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-muted">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-muted">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-hover disabled:opacity-50 transition-colors duration-150"
            >
              <LogIn size={18} className="mr-2" />
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        <p className="text-center text-xs text-text-muted">
         Demo credentials: user@example.com / password123
        </p>
        <p className="text-center text-xs mt-2">
          <a href="/status" className="text-primary hover:underline">System Status</a>
        </p>
      </div>
    </div>
  );
}
