import Link from "next/link";
import { notFound } from "next/navigation";
import { JobListing } from "../../../types/JobListing";
import { JobStatusBadge } from "../../../components/JobStatusBadge";
import ApplicationForm from "../../../components/ApplicationForm";
import { auth } from "@/src/auth";

export const dynamic = "force-dynamic";

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

async function getSingleJob(id: string): Promise<JobListing | null> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const response = await fetch(`${backendBaseUrl}/api/v1/jobs/${id}`, {
      next: { tags: ["jobs"] },
    });

    if (response.status === 404) return null;
    if (!response.ok)
      throw new Error(`Backend returned status ${response.status}`);

    return response.json();
  } catch (error) {
    throw error;
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const unwrappedParams = await params;

  // Fetch job and session in parallel
  const [job, session] = await Promise.all([
    getSingleJob(unwrappedParams.id),
    auth(),
  ]);

  if (!job) {
    notFound();
  }

  const role = session?.user?.role;
  const isEmployer = role === "employer";
  const isCandidate = role === "candidate";

  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to jobs
        </Link>
      </div>

      <article className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {job.title}
            </h1>
            <p className="text-md font-medium text-gray-600 dark:text-gray-400 mt-1">
              {job.companyName}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">📍 {job.location}</p>
          </div>
          <div className="flex gap-2 sm:flex-col sm:items-end">
            <JobStatusBadge employmentType={job.employmentType} />
            <JobStatusBadge isActive={job.isActive} />
          </div>
        </div>

        <div className="py-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
            Job Description
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {job.description}
          </p>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
          {!job.isActive ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/50 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                🔒 This position has been closed and is no longer accepting
                applications.
              </p>
            </div>
          ) : isEmployer ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Employers cannot apply for jobs.
              </p>
            </div>
          ) : !session ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-400">
                You must be signed in to apply.{" "}
                <Link
                  href="/login"
                  className="underline hover:text-blue-600 dark:hover:text-blue-300"
                >
                  Sign in here.
                </Link>
              </p>
            </div>
          ) : isCandidate ? (
            <ApplicationForm jobId={job.id} jobTitle={job.title} />
          ) : null}
        </div>
      </article>
    </main>
  );
}