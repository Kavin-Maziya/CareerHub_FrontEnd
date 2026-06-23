"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "../lib/jobsApi";
import JobList from "../components/JobList";
import JobListSkeleton from "../components/JobCardSkeleton";
import ApplicationForm from "../components/ApplicationForm";

const STORAGE_KEY = "careerhub:selectedRoomId";

export default function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    data: jobs,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  const selectedJob = jobs?.find((j) => j.id === selectedId) ?? null;

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setSelectedId(stored);
    }
  }, []);

  useEffect(() => {
    if (selectedId !== null) {
      sessionStorage.setItem(STORAGE_KEY, selectedId);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedId]);

  if (isPending) {
    return <JobListSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
          <div className="text-2xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
            Failed to Load Job Listings
          </h3>
          <p className="mt-2 text-sm text-red-700 dark:text-red-400">
            {error instanceof Error ? error.message : "An unknown network error occurred."}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
          Browse and Apply for Jobs Using this interactive portal
        </h2>

        {selectedJob && (
          <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 dark:border-blue-900 dark:bg-blue-900/20">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-500 dark:text-blue-400">
              Selected
            </p>
            <p className="mt-0.5 text-lg font-semibold text-blue-900 dark:text-blue-100">
              {selectedJob.title}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">{selectedJob.companyName}</p>
          </div>
        )}

        <div className="mt-8">
          {jobs && (
            <JobList
              jobs={jobs}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          )}
        </div>

        {!isPending && !isError && selectedJob !== null && (
          <div className="mt-10">
            <ApplicationForm jobId={selectedJob.id} jobTitle={selectedJob.title} />
          </div>
        )}
      </div>
    </main>
  );
}