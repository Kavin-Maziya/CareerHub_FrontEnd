
// JobCardSkeleton that mirrors the spacing, margins, gaps, padding, and typography layout dimensions of the real JobCard component.
 
export function JobCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700" />
      </div>

      <div className="mt-1 h-4 w-1/2 rounded bg-gray-100 dark:bg-gray-700/50" />

      <div className="mt-3 h-4 w-1/3 rounded bg-gray-300 dark:bg-gray-600" />

      <div className="mt-3 flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-700/50" />
        
        {/* Right segment: Applicant count block & Active Status Badge */}
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 rounded bg-gray-100 dark:bg-gray-700/50" />
          <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

// JobListSkeleton that replicates the 6-card grid structure of JobCard display layout.
 
export default function JobListSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <JobCardSkeleton key={index} />
      ))}
    </div>
  );
}