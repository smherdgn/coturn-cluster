"use client";
import React, { useEffect, useState } from 'react';

interface StatusResponse {
  running: boolean;
  database: boolean;
  error?: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status')
      .then(async (res) => {
        const data = await res.json();
        setStatus(data);
      })
      .catch((err) => {
        setStatus({ running: true, database: false, error: err.message });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p className="text-text text-xl">Checking system status...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background space-y-4 p-4">
      <h1 className="text-3xl font-bold text-primary-text">System Status</h1>
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md space-y-2">
        <p className="text-text">Application: <span className="font-semibold">{status?.running ? 'Running' : 'Stopped'}</span></p>
        <p className="text-text">Database connection: <span className="font-semibold">{status?.database ? 'OK' : 'Failed'}</span></p>
        {status?.error && <p className="text-danger text-sm">Error: {status.error}</p>}
      </div>
    </div>
  );
}
