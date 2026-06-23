"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "../lib/jobsApi";
import { fetchApplicationsByApplicant } from "../lib/applicationsApi";
import JobList from "../components/JobList";
import ApplicationForm from "../components/ApplicationForm";
import ApplicationList from "../components/ApplicationList";
import JobForm from "../components/JobForm";
import JobListSkeleton from "../components/JobCardSkeleton";
import ApplicationSkeleton from "../components/ApplicationSkeleton";

// Session Storage Key for preserving the selected job across soft session reloads
const SESSION_STORAGE_KEY = "careerhub:selectedRoomId";

export default function Home() {
  // STATE MANAGEMENT
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  
  const [applicantId, setApplicantId] = useState<string | null>(null);

  // Query initializer
  const {
    data: jobs,
    isPending: jobsPending,
    isError: jobsError,
    error: jobsErr,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobs,
  });

  // API TRACKING
  // Query custom backend for applicant data once the ID is fetched from storage
  const { data: myApplications, isPending: applicationsPending } = useQuery({
    queryKey: ["myApplications", applicantId],
    queryFn: () => fetchApplicationsByApplicant(applicantId!),
    enabled: !!applicantId,
  });

  // STORAGE USE EFFECTS
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Hydrate custom API identifier on mount safely in the browser context
      setApplicantId(localStorage.getItem("careerhub:applicantId"));
      
      // Restores selection state without running an array-validation guard
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored !== null) {
        setSelectedId(stored);
      }
    }
  }, []);

  // Update session storage whenever selection changes
  useEffect(() => {
    if (selectedId !== null) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, selectedId);
    } else {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [selectedId]);

  // Compute currently highlighted job entity based on React Query payload
  const selectedJob = jobs?.find((j) => j.id === selectedId) ?? null;

  // Syncs incoming form submissions with local storage targets to satisfy custom API routes
  function handleApplicationSuccess(newApplicantId: string) {
    localStorage.setItem("careerhub:applicantId", newApplicantId);
    setApplicantId(newApplicantId);
  }

  // PENDING STATE
  // Renders JobListSkeleton when data fetch is pending
  if (jobsPending) {
    return <JobListSkeleton />;
  }

  // ERROR STATE
  if (jobsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            {jobsErr instanceof Error ? jobsErr.message : "An unknown network error occurred."}
          </p>
          <button
            onClick={() => refetchJobs()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* Portal Header Controls */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
            CareerHub Portal
          </h1>
          <button
            onClick={() => setShowJobForm((prev) => !prev)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
          >
            {showJobForm ? "Cancel" : "Post a Job"}
          </button>
        </div>

        {/* Create Job Form View toggled dynamically */}
        {showJobForm && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <JobForm onSuccess={() => setShowJobForm(false)} />
          </div>
        )}

        {/* JobList UI guarded against undefined data payloads */}
        <div>
          {jobs && (
            <JobList
              jobs={jobs}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id === selectedId ? null : id)}
            />
          )}
        </div>

        {/* Application Input Form Container */}
        {selectedJob && (
          <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
            <ApplicationForm
              jobId={selectedJob.id}
              jobTitle={selectedJob.title}
              onSuccess={handleApplicationSuccess}
            />
          </div>
        )}

        {/* Application Panel */}
        <div className="border-t pt-10 border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">My Submitted Applications</h3>
          {applicantId ? (
            applicationsPending ? (
              <ApplicationSkeleton />
            ) : myApplications ? (
              <ApplicationList applications={myApplications} />
            ) : (
              <p className="text-sm text-gray-500 mt-2">No applications found.</p>
            )
          ) : (
            <p className="text-sm text-gray-500 mt-2">No locally tracked submissions found in this browser context.</p>
          )}
        </div>

      </div>
    </main>
  );
}


// "use client";

// import { useState, useEffect } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { fetchJobs } from "../lib/jobsApi";
// import { fetchApplicationsByApplicant } from "../lib/applicationsApi"; 
// import JobList from "../components/JobList";

// // Explicit relative paths eliminate module resolution bugs from misconfigured aliases
// import ApplicationForm from "../components/ApplicationForm";
// import ApplicationList from "../components/ApplicationList";

// export default function Home() {
//   const [selectedId, setSelectedId] = useState<string | null>(null);
//   const [applicantId, setApplicantId] = useState<string | null>(null);

//   useEffect(() => {
//     if (typeof window !== "undefined") {
//       setApplicantId(localStorage.getItem("careerhub:applicantId"));
//     }
//   }, []);

//   const { data: jobs, isPending: jobsPending } = useQuery({
//     queryKey: ["jobs"],
//     queryFn: fetchJobs,
//   });

//   const { data: myApplications, refetch: refetchApplications } = useQuery({
//     queryKey: ["myApplications", applicantId],
//     queryFn: () => fetchApplicationsByApplicant(applicantId!),
//     enabled: !!applicantId, 
//   });

//   const selectedJob = jobs?.find((j) => j.id === selectedId) ?? null;

//   function handleApplicationSuccess(newApplicantId: string) {
//     localStorage.setItem("careerhub:applicantId", newApplicantId);
//     setApplicantId(newApplicantId);
//     refetchApplications();
//   }

//   if (jobsPending) return <div className="p-8 text-center text-sm text-gray-500">Loading portal metrics...</div>;

//   return (
//     <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
//       <div className="mx-auto max-w-6xl space-y-10">
//         <div>
//           <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">CareerHub Portal</h1>
//           <div className="mt-8">
//             {jobs && <JobList jobs={jobs} selectedId={selectedId} onSelect={(id) => setSelectedId(id === selectedId ? null : id)} />}
//           </div>

//           {selectedJob && (
//             <div className="mt-10 rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
//               <ApplicationForm jobId={selectedJob.id} jobTitle={selectedJob.title} onSuccess={handleApplicationSuccess} />
//             </div>
//           )}
//         </div>

//         <div className="border-t pt-10 border-gray-200 dark:border-gray-800">
//           <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">My Submitted Applications</h3>
//           {applicantId && myApplications ? <ApplicationList applications={myApplications} /> : <p className="text-sm text-gray-500 mt-2">No locally tracked submissions found in this browser context.</p>}
//         </div>
//       </div>
//     </main>
//   );
// }










// // "use client";

// // import { useState, useEffect } from "react";
// // import { useQuery } from "@tanstack/react-query";
// // import { fetchJobs } from "../lib/jobsApi";
// // import JobList from "../components/JobList";
// // import JobListSkeleton from "../components/JobCardSkeleton";
// // import ApplicationForm from "../components/ApplicationForm";

// // const STORAGE_KEY = "careerhub:selectedRoomId";

// // export default function Home() {
// //   const [selectedId, setSelectedId] = useState<string | null>(null);

// //   const {
// //     data: jobs,
// //     isPending,
// //     isError,
// //     error,
// //     refetch,
// //   } = useQuery({
// //     queryKey: ["jobs"],
// //     queryFn: fetchJobs,
// //   });

// //   const selectedJob = jobs?.find((j) => j.id === selectedId) ?? null;

// //   function handleSelect(id: string) {
// //     setSelectedId((prev) => (prev === id ? null : id));
// //   }

// //   useEffect(() => {
// //     const stored = sessionStorage.getItem(STORAGE_KEY);
// //     if (stored !== null) {
// //       setSelectedId(stored);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     if (selectedId !== null) {
// //       sessionStorage.setItem(STORAGE_KEY, selectedId);
// //     } else {
// //       sessionStorage.removeItem(STORAGE_KEY);
// //     }
// //   }, [selectedId]);

// //   if (isPending) {
// //     return <JobListSkeleton />;
// //   }

// //   if (isError) {
// //     return (
// //       <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6 dark:bg-gray-950">
// //         <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm dark:border-red-900/50 dark:bg-red-950/20">
// //           <div className="text-2xl mb-2">⚠️</div>
// //           <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">
// //             Failed to Load Job Listings
// //           </h3>
// //           <p className="mt-2 text-sm text-red-700 dark:text-red-400">
// //             {error instanceof Error ? error.message : "An unknown network error occurred."}
// //           </p>
// //           <button
// //             onClick={() => refetch()}
// //             className="mt-5 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
// //           >
// //             Try again
// //           </button>
// //         </div>
// //       </div>
// //     );
// //   }

// //   return (
// //     <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
// //       <div className="mx-auto max-w-6xl">
// //         <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mt-2">
// //           Browse and Apply for Jobs Using this interactive portal
// //         </h2>

// //         {selectedJob && (
// //           <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 px-6 py-4 dark:border-blue-900 dark:bg-blue-900/20">
// //             <p className="text-xs font-medium uppercase tracking-wide text-blue-500 dark:text-blue-400">
// //               Selected
// //             </p>
// //             <p className="mt-0.5 text-lg font-semibold text-blue-900 dark:text-blue-100">
// //               {selectedJob.title}
// //             </p>
// //             <p className="text-sm text-blue-700 dark:text-blue-300">{selectedJob.companyName}</p>
// //           </div>
// //         )}

// //         <div className="mt-8">
// //           {jobs && (
// //             <JobList
// //               jobs={jobs}
// //               selectedId={selectedId}
// //               onSelect={handleSelect}
// //             />
// //           )}
// //         </div>

// //         {!isPending && !isError && selectedJob !== null && (
// //           <div className="mt-10">
// //             <ApplicationForm jobId={selectedJob.id} jobTitle={selectedJob.title} />
// //           </div>
// //         )}
// //       </div>
// //     </main>
// //   );
// // }

