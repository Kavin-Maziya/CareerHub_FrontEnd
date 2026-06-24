import Link from "next/link";
import { JobListing } from "../../../types/JobListing";
import { JobStatusBadge } from "../../../components/JobStatusBadge";

export const dynamic = "force-dynamic"; // Forces raw backend reads on every load

async function getDashboardJobs(): Promise<JobListing[]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${backendBaseUrl}/api/v1/jobs`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Dashboard API fetch failed with status: ${response.status}`);
  }

  return response.json();
}

export default async function DashboardListingsPage() {
  const jobs = await getDashboardJobs();
  const count = jobs.length;

  return (
    <div className="space-y-6">
      {/* Title & Count Subheading */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Manage Postings
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          {count} {count === 1 ? "listing" : "listings"}
        </p>
      </div>

      {/* Conditional Rendering: Empty State vs. Data Table */}
      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700 bg-white dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No active job listings found. Create a vacancy item to populate this control matrix.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3.5">Title</th>
                <th className="px-6 py-3.5">Company</th>
                <th className="px-6 py-3.5">Location</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {job.title}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600 dark:text-gray-400">
                    {job.companyName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-500 dark:text-gray-400">
                    {job.location}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 flex gap-1.5 items-center">
                    {/* Render Category Badge followed by Active/Closed Trace Badge */}
                    <JobStatusBadge employmentType={job.employmentType} />
                    <JobStatusBadge isActive={job.isActive} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}