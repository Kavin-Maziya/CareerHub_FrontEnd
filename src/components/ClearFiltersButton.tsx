"use client";

import { useRouter } from "next/navigation";

export default function ClearFiltersButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/jobs")}
      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
    >
      Clear all filters
    </button>
  );
}