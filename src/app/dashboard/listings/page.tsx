import { Suspense } from "react";
import ApplicationsSummary from "@/src/components/ApplicationsSummary";
import ApplicationsSummarySkeleton from "@/src/components/ApplicationsSummarySkeleton";
import ListingsTableSkeleton from "@/src/components/ListingsTableSkeleton";
import DashboardToolbar from "@/src/components/DashboardToolbar";
import ListingsTableWrapper from "@/src/components/ListingsTableWrapper";
import { EmploymentType } from "@/src/types/JobListing";

interface BackendJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  isActive: boolean;
  applicationCount: number;
  employmentType: EmploymentType;
}

async function getJobs(): Promise<BackendJob[]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(
    `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
    { next: { tags: ["jobs"] } } // Tag-based cache preserved
  );

  if (!response.ok) throw new Error(`Jobs fetch failed (${response.status})`);

  const result = await response.json();
  return result.data ?? [];
}

async function getStats(): Promise<[string, number][]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!backendBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

  const response = await fetch(
    `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
    { cache: "no-store" } // Dynamic live fetching preserved
  );

  if (!response.ok) throw new Error(`Stats fetch failed (${response.status})`);

  const result = await response.json();
  const jobs: BackendJob[] = result.data ?? [];

  return jobs.map((job) => [job.id, job.applicationCount]);
}

// 1. MAIN ROUTE SERVER PAGE
// No top-level await here. This allows Next.js to immediately stream the headers,
// layout shell, and toolbar down to the client browser at T=0ms.
export default function DashboardListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Manage Postings
        </h1>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
          Available Job Listings
        </p>
      </div>

      <Suspense fallback={<ApplicationsSummarySkeleton />}>
        <ApplicationsSummary />
      </Suspense>

      {/* Client Component — reads Zustand store, renders toolbar */}
      <DashboardToolbar />

      {/* This Suspense boundary now wraps the actual async data container. 
        It correctly captures the loading state and isolates any fetch runtime errors.
      */}
      <Suspense fallback={<ListingsTableSkeleton />}>
        <ListingsTableDataContainer />
      </Suspense>
    </div>
  );
}

// 2. INTERNAL SERVER DATA CONTAINER
// This container confines the blocking Promise.all execution underneath 
// the Suspense boundary. It feeds data into your original client wrapper seamlessly.
async function ListingsTableDataContainer() {
  const [jobs, statsMap] = await Promise.all([getJobs(), getStats()]);
  
  return <ListingsTableWrapper jobs={jobs} statsMap={statsMap} />;
}



// import { Suspense } from "react";
// import ApplicationsSummary from "@/src/components/ApplicationsSummary";
// import ApplicationsSummarySkeleton from "@/src/components/ApplicationsSummarySkeleton";
// import ListingsTableSkeleton from "@/src/components/ListingsTableSkeleton";
// import DashboardToolbar from "@/src/components/DashboardToolbar";
// import ListingsTableWrapper from "@/src/components/ListingsTableWrapper";
// import { EmploymentType } from "@/src/types/JobListing";

// interface BackendJob {
//   id: string;
//   title: string;
//   companyName: string;
//   location: string;
//   isActive: boolean;
//   applicationCount: number;
//   employmentType: EmploymentType;
// }

// async function getJobs(): Promise<BackendJob[]> {
//   const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
//   if (!backendBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

//   const response = await fetch(
//     `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
//     { next: { tags: ["jobs"] } }
//   );

//   if (!response.ok) throw new Error(`Jobs fetch failed (${response.status})`);

//   const result = await response.json();
//   return result.data ?? [];
// }

// async function getStats(): Promise<[string, number][]> {
//   const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;
//   if (!backendBaseUrl) throw new Error("NEXT_PUBLIC_API_URL is not configured");

//   const response = await fetch(
//     `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
//     { cache: "no-store" }
//   );

//   if (!response.ok) throw new Error(`Stats fetch failed (${response.status})`);

//   const result = await response.json();
//   const jobs: BackendJob[] = result.data ?? [];

//   return jobs.map((job) => [job.id, job.applicationCount]);
// }

// export default async function DashboardListingsPage() {
//   const [jobs, statsMap] = await Promise.all([getJobs(), getStats()]);

//   return (
//     <div className="space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
//           Manage Postings
//         </h1>
//         <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">
//           Available Job Listings
//         </p>
//       </div>

//       <Suspense fallback={<ApplicationsSummarySkeleton />}>
//         <ApplicationsSummary />
//       </Suspense>

//       {/* Client Component — reads Zustand store, renders toolbar */}
//       <DashboardToolbar />

//       {/*
//         Page fetches data server-side and passes it to the Client Component wrapper.
//         The wrapper reads view and showClosedJobs from the Zustand store and passes
//         all values as props to ListingsTable — bridging the Server/Client boundary.
//       */}
//       <Suspense fallback={<ListingsTableSkeleton />}>
//         <ListingsTableWrapper jobs={jobs} statsMap={statsMap} />
//       </Suspense>
//     </div>
//   );
// }