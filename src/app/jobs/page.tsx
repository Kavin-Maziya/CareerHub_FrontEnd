import JobLinkCard from "../../components/JobLinkCard";
import { JobListing } from "../../types/JobListing";

export const dynamic = "force-dynamic"; // Ensures fresh evaluation on every load

async function getJobs(): Promise<JobListing[]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${backendBaseUrl}/api/v1/jobs`, {
    cache: "no-store", // Forces an raw upstream query without picking up cached states
  });

  if (!response.ok) {
    throw new Error(`Failed to load jobs list from C# backend (Status: ${response.status})`);
  }

  return response.json();
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Available Positions
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Explore current openings and jumpstart your career track.
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No job opportunities are listed at the moment. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobLinkCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}