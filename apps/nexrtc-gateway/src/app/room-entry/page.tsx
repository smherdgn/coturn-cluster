
"use client";
import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Video, LogOut, Users, ShieldCheck } from 'lucide-react'; // Added ShieldCheck for admin link
import Link from 'next/link'; // Import Link

export default function RoomEntryPage() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();
  const { user, logout, isLoading, isAdmin } = useAuth(); // Added isAdmin

  const handleJoinRoom = (e: FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/call/${roomId.trim()}`);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-text text-xl">Loading user...</p></div>;
  }

  if (!user) {
    // This should ideally be handled by middleware redirecting to login
    router.push('/login');
    return <div className="flex items-center justify-center min-h-screen bg-background"><p className="text-text text-xl">Redirecting to login...</p></div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-slate-900 to-background p-4">
      <div className="absolute top-4 right-4 flex items-center space-x-2">
          {isAdmin && (
            <Link href="/admin/dashboard" legacyBehavior>
              <a className="flex items-center py-2 px-4 border border-secondary rounded-md shadow-sm text-sm font-medium text-secondary hover:bg-secondary hover:text-primary-text focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-colors duration-150">
                <ShieldCheck size={18} className="mr-2" />
                Admin Panel
              </a>
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text bg-danger hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-150"
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </button>
        </div>
      <div className="w-full max-w-md p-8 space-y-8 bg-card shadow-xl rounded-lg border border-border">
        <div className="text-center">
          <Users size={48} className="mx-auto text-primary mb-4" />
          <h1 className="text-3xl font-bold text-primary-text">Join or Create a Room</h1>
          <p className="text-text-muted mt-2">Welcome, {user?.email}! Enter a room ID to start a video call.</p>
        </div>
        
        <form onSubmit={handleJoinRoom} className="space-y-6">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-text-muted">
              Room ID
            </label>
            <input
              id="roomId"
              name="roomId"
              type="text"
              required
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="e.g., my-cool-room"
            />
          </div>
          
          <div>
            <button
              type="submit"
              disabled={!roomId.trim()}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-text bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-hover disabled:opacity-50 transition-colors duration-150"
            >
              <Video size={18} className="mr-2" />
              Join Room
            </button>
          </div>
        </form>
      </div>
       <p className="mt-8 text-sm text-text-muted">
         Enter any Room ID. If it doesn't exist, a new room will be created.
       </p>
       <p className="mt-2 text-sm">
          <a href="/status" className="text-primary hover:underline">Check System Status</a>
       </p>
    </div>
  );
}
