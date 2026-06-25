interface StatEntry {
  jobId: string;
  applicationCount: number;
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
  const jobs = result.data ?? [];

  return jobs.map((job: { id: string; applicationCount: number }) => ({
    jobId: job.id,
    applicationCount: job.applicationCount,
  }));
}

export default async function ApplicationsSummary() {
  const stats = await getApplicationStats();
  const total = stats.reduce((sum, s) => sum + s.applicationCount, 0);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 w-full max-w-xs shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        Total Applications
      </p>
      <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">{total}</p>
    </div>
  );
}