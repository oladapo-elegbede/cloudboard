"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth-context";
import { listOrganizations } from "../lib/organizations-api";
import { ApiError } from "../lib/api-client";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

export default function OrganizationsPage() {
  const router = useRouter();
  const { status, accessToken, user, logout } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const query = useQuery({
    queryKey: ["organizations"],
    queryFn: () => listOrganizations(accessToken as string),
    enabled: status === "authenticated" && Boolean(accessToken),
  });

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </main>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold">CloudBoard</h1>
            {user && <p className="mt-1 text-sm text-gray-400">Signed in as {user.name}</p>}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-900"
          >
            Log out
          </button>
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Your organizations</h2>

          {query.isLoading && <LoadingState />}

          {query.isError && (
            <ErrorState
              message={
                query.error instanceof ApiError
                  ? query.error.message
                  : "Could not load your organizations"
              }
              onRetry={() => query.refetch()}
            />
          )}

          {query.isSuccess && query.data.length === 0 && (
            <EmptyState
              title="No organizations yet"
              description="You have not been added to any organizations."
            />
          )}

          {query.isSuccess && query.data.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {query.data.map((org) => (
                <li key={org.id}>
                  <Link
                    href={`/organizations/${org.id}`}
                    className="block rounded-lg border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-gray-700 hover:bg-gray-900/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">{org.name}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{org.slug}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-gray-700 px-2 py-0.5 text-xs uppercase tracking-wide text-gray-400">
                        {org.role}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
