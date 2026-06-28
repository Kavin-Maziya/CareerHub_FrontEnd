"use client";

import {
  useView,
  useSetView,
  useShowClosedJobs,
  useToggleShowClosedJobs,
} from "@/src/stores/dashboardStore";

export default function DashboardToolbar() {
  // One useStore call per value as required — no destructuring
  const view = useView();
  const setView = useSetView();
  const showClosedJobs = useShowClosedJobs();
  const toggleShowClosedJobs = useToggleShowClosedJobs();

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
      {/* View toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("table")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "table"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          Table
        </button>
        <button
          onClick={() => setView("grid")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "grid"
              ? "bg-blue-600 text-white"
              : "border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
          }`}
        >
          Grid
        </button>
      </div>

      {/* Show closed jobs checkbox */}
      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={showClosedJobs}
          onChange={toggleShowClosedJobs}
          className="h-4 w-4 rounded accent-blue-600 dark:accent-blue-500"
        />
        Show closed jobs
      </label>
    </div>
  );
}