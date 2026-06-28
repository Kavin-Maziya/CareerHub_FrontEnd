import Link from "next/link";
import { JobStatusBadge } from "./JobStatusBadge";
import CloseJobButton from "./CloseJobButton";
import { EmploymentType } from "../types/JobListing";

interface BackendJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  isActive: boolean;
  applicationCount: number;
  employmentType: EmploymentType;
}

interface StatEntry {
  jobId: string;
  applicationCount: number;
}

interface ListingsTableProps {
  view: "table" | "grid";
  showClosedJobs: boolean;
}

async function getJobs(): Promise<BackendJob[]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(
    `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
    { next: { tags: ["jobs"] } }
  );

  if (!response.ok) throw new Error(`Jobs fetch failed (${response.status})`);

  const result = await response.json();
  return result.data ?? [];
}

async function getApplicationStats(): Promise<StatEntry[]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(
    `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
    { cache: "no-store" }
  );

  if (!response.ok) throw new Error(`Stats fetch failed (${response.status})`);

  const result = await response.json();
  const jobs: BackendJob[] = result.data ?? [];

  return jobs.map((job) => ({
    jobId: job.id,
    applicationCount: job.applicationCount,
  }));
}

export default async function ListingsTable({ view, showClosedJobs }: ListingsTableProps) {
  const [jobs, stats] = await Promise.all([getJobs(), getApplicationStats()]);

  const statsMap = new Map(stats.map((s) => [s.jobId, s.applicationCount]));

  // Filter closed jobs if showClosedJobs is false
  const visibleJobs = showClosedJobs
    ? jobs
    : jobs.filter((job) => job.isActive);

  if (visibleJobs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700 bg-white dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No job listings found. Create a vacancy to populate this table.
        </p>
      </div>
    );
  }

  // Grid view
  if (view === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleJobs.map((job) => (
          <div
            key={job.id}
            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {job.title}
              </h3>
              <JobStatusBadge isActive={job.isActive} />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {job.companyName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
              📍 {job.location}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {statsMap.get(job.id) ?? 0} applications
              </span>
              <JobStatusBadge employmentType={job.employmentType} />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
              <Link
                href={`/jobs/${job.id}`}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                View
              </Link>
              <CloseJobButton jobId={job.id} currentStatus={job.isActive} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Table view (default)
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          <tr>
            <th className="px-6 py-3.5">Title</th>
            <th className="px-6 py-3.5">Company</th>
            <th className="px-6 py-3.5">Location</th>
            <th className="px-6 py-3.5">Status</th>
            <th className="px-6 py-3.5">Applications</th>
            <th className="px-6 py-3.5">View</th>
            <th className="px-6 py-3.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
          {visibleJobs.map((job) => (
            <tr
              key={job.id}
              className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
            >
              <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                {job.title}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-400">
                {job.companyName}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                {job.location}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex gap-1.5 items-center">
                  <JobStatusBadge employmentType={job.employmentType} />
                  <JobStatusBadge isActive={job.isActive} />
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-400">
                {statsMap.get(job.id) ?? 0}
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <Link
                  href={`/jobs/${job.id}`}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View
                </Link>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right">
                <CloseJobButton jobId={job.id} currentStatus={job.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}