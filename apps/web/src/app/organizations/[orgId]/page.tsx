"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/auth-context";
import { getOrganization } from "../../../lib/organizations-api";
import { listOrganizationBoards } from "../../../lib/boards-api";
import { ApiError } from "../../../lib/api-client";
import { LoadingState } from "../../../components/LoadingState";
import { ErrorState } from "../../../components/ErrorState";
import { EmptyState } from "../../../components/EmptyState";

export default function OrganizationBoardsPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = typeof params.orgId === "string" ? params.orgId : "";
  const { status, accessToken } = useAuth();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const orgQuery = useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => getOrganization(accessToken as string, orgId),
    enabled: status === "authenticated" && Boolean(accessToken) && Boolean(orgId),
  });

  const boardsQuery = useQuery({
    queryKey: ["boards", orgId],
    queryFn: () => listOrganizationBoards(accessToken as string, orgId),
    enabled: status === "authenticated" && Boolean(accessToken) && Boolean(orgId),
  });

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <LoadingState />
      </main>
    );
  }

  const orgErrorIsAccessRelated =
    orgQuery.error instanceof ApiError &&
    (orgQuery.error.status === 403 || orgQuery.error.status === 404);

  if (orgErrorIsAccessRelated) {
    return (
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-4xl">
          <ErrorState message="Organization not found or you do not have access." />
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-blue-400 hover:text-blue-300">
              Back to organizations
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="border-b border-gray-800 pb-6">
          <Link href="/" className="mb-4 inline-block text-sm text-gray-400 hover:text-gray-200">
            Back to organizations
          </Link>
          {orgQuery.isLoading && <LoadingState />}
          {orgQuery.isSuccess && (
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{orgQuery.data.name}</h1>
                <p className="mt-1 text-sm text-gray-400">{orgQuery.data.slug}</p>
              </div>
              <span className="rounded-full border border-gray-700 px-3 py-1 text-xs uppercase tracking-wide text-gray-400">
                {orgQuery.data.role}
              </span>
            </div>
          )}
          {orgQuery.isError && !orgErrorIsAccessRelated && (
            <ErrorState
              message={
                orgQuery.error instanceof ApiError
                  ? orgQuery.error.message
                  : "Could not load organization details"
              }
              onRetry={() => orgQuery.refetch()}
            />
          )}
        </header>

        <section>
          <h2 className="mb-4 text-xl font-semibold">Boards</h2>

          {boardsQuery.isLoading && <LoadingState />}

          {boardsQuery.isError && (
            <ErrorState
              message={
                boardsQuery.error instanceof ApiError
                  ? boardsQuery.error.message
                  : "Could not load boards"
              }
              onRetry={() => boardsQuery.refetch()}
            />
          )}

          {boardsQuery.isSuccess && boardsQuery.data.length === 0 && (
            <EmptyState
              title="No boards yet"
              description="Boards you create in this organization will appear here."
            />
          )}

          {boardsQuery.isSuccess && boardsQuery.data.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {boardsQuery.data.map((board) => (
                <li key={board.id}>
                  <Link
                    href={`/boards/${board.id}`}
                    className="block rounded-lg border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-gray-700 hover:bg-gray-900/60"
                  >
                    <p className="truncate text-lg font-semibold text-white">{board.name}</p>
                    {board.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-gray-400">{board.description}</p>
                    )}
                    <p className="mt-3 text-xs text-gray-500">
                      Created {new Date(board.createdAt).toLocaleDateString()}
                    </p>
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
