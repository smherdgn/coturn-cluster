
"use client";
import React, { useState, useEffect } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// This is a very basic toaster. For a real app, consider a library.
// This global state for toasts is a simplification.
let toastId = 0;
const listeners: Array<(toast: ToastMessage) => void> = [];

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const newToast = { id: toastId++, message, type };
  listeners.forEach(listener => listener(newToast));
}


export function Toaster() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const addToastListener = (newToast: ToastMessage) => {
      setToasts(currentToasts => [...currentToasts, newToast]);
      setTimeout(() => {
        setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
      }, 3000);
    };

    listeners.push(addToastListener);
    return () => {
      const index = listeners.indexOf(addToastListener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`p-4 rounded-md shadow-lg text-white ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
