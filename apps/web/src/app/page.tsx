"use client";

import { useEffect, useState } from "react";

type HealthStatus = "loading" | "healthy" | "unreachable";

interface HealthResponse {
  success: boolean;
  data?: {
    status: string;
    timestamp: string;
  };
}

export default function HomePage() {
  const [status, setStatus] = useState<HealthStatus>("loading");
  const [timestamp, setTimestamp] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch("http://localhost:3000/health");
        const data: HealthResponse = await response.json();

        if (data.success && data.data) {
          setStatus("healthy");
          setTimestamp(data.data.timestamp);
        } else {
          setStatus("unreachable");
        }
      } catch (error) {
        console.error("Failed to fetch health status:", error);
        setStatus("unreachable");
      }
    };

    checkHealth();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">CloudBoard</h1>
          <p className="text-gray-400 text-lg">Team collaboration platform</p>
        </div>

        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>

          {status === "loading" && <p className="text-gray-400">Checking API status...</p>}

          {status === "healthy" && (
            <div className="space-y-2">
              <p className="text-green-400 font-medium">API is healthy</p>
              {timestamp && (
                <p className="text-gray-500 text-sm">
                  Last checked: {new Date(timestamp).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {status === "unreachable" && (
            <p className="text-red-400 font-medium">
              API is unreachable. Make sure the backend is running.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
