"use client";

import { useQueryStates, parseAsString } from "nuqs";
import { useState, useEffect } from "react";

export default function JobFilters() {
  const [filters, setFilters] = useQueryStates({
    q:        parseAsString.withDefault(""),
    location: parseAsString.withDefault(""),
    status:   parseAsString.withDefault("all"),
  });

  // Local state for debounced inputs
  const [keywordInput, setKeywordInput]   = useState(filters.q);
  const [locationInput, setLocationInput] = useState(filters.location);

  // Debounce keyword — only update URL after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ q: keywordInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [keywordInput]);

  // Debounce location — only update URL after 300ms of no typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ location: locationInput });
    }, 300);
    return () => clearTimeout(timer);
  }, [locationInput]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Keyword search */}
      <input
        type="text"
        value={keywordInput}
        onChange={(e) => setKeywordInput(e.target.value)}
        placeholder="Search by keyword..."
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />

      {/* Location search */}
      <input
        type="text"
        value={locationInput}
        onChange={(e) => setLocationInput(e.target.value)}
        placeholder="Filter by location..."
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
      />

      {/* Status toggle — updates immediately, no debounce needed */}
      <select
        value={filters.status}
        onChange={(e) => setFilters({ status: e.target.value })}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
      >
        <option value="all">All Jobs</option>
        <option value="open">Open Only</option>
      </select>
    </div>
  );
}