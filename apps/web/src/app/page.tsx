"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/auth-context";

export default function HomePage() {
  const router = useRouter();
  const { status, user, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </main>
    );
  }

  if (status === "unauthenticated" || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-4">CloudBoard</h1>
          <p className="text-gray-400 text-lg">Welcome back, {user.name}</p>
        </div>

        <div className="border border-gray-800 rounded-lg p-6 bg-gray-900 space-y-4">
          <h2 className="text-xl font-semibold">Your Account</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-400">Name:</span>{" "}
              <span className="text-white">{user.name}</span>
            </div>
            <div>
              <span className="text-gray-400">Email:</span>{" "}
              <span className="text-white">{user.email}</span>
            </div>
            <div>
              <span className="text-gray-400">Email verified:</span>{" "}
              <span className="text-white">{user.emailVerified ? "Yes" : "No"}</span>
            </div>
            <div>
              <span className="text-gray-400">Account created:</span>{" "}
              <span className="text-white">{new Date(user.createdAt).toLocaleString()}</span>
            </div>
            {user.lastLoginAt && (
              <div>
                <span className="text-gray-400">Last login:</span>{" "}
                <span className="text-white">{new Date(user.lastLoginAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          Log out
        </button>
      </div>
    </main>
  );
}
