import Link from "next/link";
import JobLinkCard from "../../components/JobLinkCard";
import { EmploymentType, JobListing } from "../../types/JobListing";
import JobFilters from "../../components/JobFilters";
import ClearFiltersButton from "../../components/ClearFiltersButton";

export const dynamic = "force-dynamic";

interface BackendJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
  postedAt: string;
  salaryDisplay: string;
  closingDate: string;
  applicationCount: number;
  isActive: boolean;
  employmentType: EmploymentType;
}

interface PagedResponse {
  data: BackendJob[];
}

interface JobsPageProps {
  searchParams: Promise<{
    q?: string;
    location?: string;
    status?: string;
  }>;
}

// Updated primitive to return both filtered metrics and original DB population status
async function getJobs(filters: {
  q: string;
  location: string;
  status: string;
}): Promise<{ filteredJobs: JobListing[]; isDbEmpty: boolean }> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
    {
      next: { tags: ["jobs"] },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load jobs (${response.status})`);
  }

  const result: PagedResponse = await response.json();
  
  // Rule Check: Did the microservice return an empty database collection?
  const isDbEmpty = !result.data || result.data.length === 0;

  const jobs: JobListing[] = (result.data ?? []).map((job) => ({
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    description: job.description,
    employmentType: job.employmentType,
    salaryMin: 0,
    salaryMax: 0,
    postedAt: job.postedAt,
    isActive: job.isActive,
    applicantCount: job.applicationCount,
  }));

  // Local JavaScript fallback filter engine
  const filteredJobs = jobs.filter((job) => {
    const matchesKeyword =
      filters.q === "" ||
      job.title.toLowerCase().includes(filters.q.toLowerCase()) ||
      job.companyName.toLowerCase().includes(filters.q.toLowerCase()) ||
      job.description.toLowerCase().includes(filters.q.toLowerCase());

    const matchesLocation =
      filters.location === "" ||
      job.location.toLowerCase().includes(filters.location.toLowerCase());

    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "open" && job.isActive);

    return matchesKeyword && matchesLocation && matchesStatus;
  });

  return { filteredJobs, isDbEmpty };
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const resolvedParams = await searchParams;

  const filters = {
    q:        resolvedParams.q        ?? "",
    location: resolvedParams.location ?? "",
    status:   resolvedParams.status   ?? "all",
  };

  const { filteredJobs, isDbEmpty } = await getJobs(filters);

  return (
    <main className="container mx-auto px-4 py-8">
      <section>
        <h1 className="mb-6 text-3xl font-bold">All Job Listings</h1>

        <Link
          href="/jobs/create"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          Post Job
        </Link>

        {/* Client Component — manages filter state in the URL */}
        <JobFilters />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isDbEmpty ? (
            /* Empty State 1: Zero records exist overall inside the system database */
            <div className="col-span-full py-16 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 p-12">
              <p className="text-gray-500 font-medium dark:text-gray-400">
                No jobs are currently listed.
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            /* Empty State 2: Records exist but query parameters wiped matches out */
            <div className="col-span-full py-16 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 p-12 space-y-4">
              <div>
                <p className="text-gray-500 font-medium dark:text-gray-400">
                  No jobs match your search.
                </p>
                {filters.q && (
                  <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">
                    Active Keyword constraint: "{filters.q}"
                  </p>
                )}
              </div>
              <ClearFiltersButton />
            </div>
          ) : (
            /* Active Match State */
            filteredJobs.map((job) => (
              <JobLinkCard key={job.id} job={job} />
            ))
          )}
        </div>
      </section>
    </main>
  );
}



// import Link from "next/link";
// import JobLinkCard from "../../components/JobLinkCard";
// import { EmploymentType, JobListing } from "../../types/JobListing";
// import JobFilters from "../../components/JobFilters";

// export const dynamic = "force-dynamic";

// interface BackendJob {
//   id: string;
//   title: string;
//   companyName: string;
//   location: string;
//   description: string;
//   postedAt: string;
//   salaryDisplay: string;
//   closingDate: string;
//   applicationCount: number;
//   isActive: boolean;
//   employmentType: EmploymentType;
// }

// interface PagedResponse {
//   data: BackendJob[];
// }

// interface JobsPageProps {
//   searchParams: Promise<{
//     q?: string;
//     location?: string;
//     status?: string;
//   }>;
// }

// async function getJobs(filters: {
//   q: string;
//   location: string;
//   status: string;
// }): Promise<JobListing[]> {
//   const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

//   if (!backendBaseUrl) {
//     throw new Error("NEXT_PUBLIC_API_URL is not configured");
//   }

//   const response = await fetch(
//     `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
//     {
//       next: { tags: ["jobs"] },
//     },
//   );

//   if (!response.ok) {
//     throw new Error(`Failed to load jobs (${response.status})`);
//   }

//   const result: PagedResponse = await response.json();

//   const jobs: JobListing[] = result.data.map((job) => ({
//     id: job.id,
//     title: job.title,
//     companyName: job.companyName,
//     location: job.location,
//     description: job.description,
//     employmentType: job.employmentType,
//     salaryMin: 0,
//     salaryMax: 0,
//     postedAt: job.postedAt,
//     isActive: job.isActive,
//     applicantCount: job.applicationCount,
//   }));

//   // Filter in JS after fetch — API does not support filtering
//   return jobs.filter((job) => {
//     const matchesKeyword =
//       filters.q === "" ||
//       job.title.toLowerCase().includes(filters.q.toLowerCase()) ||
//       job.companyName.toLowerCase().includes(filters.q.toLowerCase()) ||
//       job.description.toLowerCase().includes(filters.q.toLowerCase());

//     const matchesLocation =
//       filters.location === "" ||
//       job.location.toLowerCase().includes(filters.location.toLowerCase());

//     const matchesStatus =
//     filters.status === "all" ||
//      (filters.status === "open" && job.isActive);

//     return matchesKeyword && matchesLocation && matchesStatus;
//   });
// }

// export default async function JobsPage({ searchParams }: JobsPageProps) {
//   const resolvedParams = await searchParams;

//   const filters = {
//     q:        resolvedParams.q        ?? "",
//     location: resolvedParams.location ?? "",
//     status:   resolvedParams.status   ?? "all",
//   };

//   const jobs = await getJobs(filters);

//   return (
//     <main className="container mx-auto px-4 py-8">
//       <section>
//         <h1 className="mb-6 text-3xl font-bold">All Job Listings</h1>

//         <Link
//           href="/jobs/create"
//           className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
//         >
//           Post Job
//         </Link>

//         {/* Client Component — manages filter state in the URL */}
//         <JobFilters />

//         <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
//           {jobs.length === 0 ? (
//             <p className="text-sm text-gray-500 dark:text-gray-400 col-span-full">
//               No jobs match your current filters.
//             </p>
//           ) : (
//             jobs.map((job) => (
//               <JobLinkCard key={job.id} job={job} />
//             ))
//           )}
//         </div>
//       </section>
//     </main>
//   );
// }