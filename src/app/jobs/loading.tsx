import JobListSkeleton from "../../components/JobCardSkeleton";

export default function JobsLoading() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/*
        This prevents the "All Job Listings" title area from shifting when data loads. 
      */}
      <div className="mb-8 space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Replaced the inline generic grey blocks with your exact, paired grid of 6 JobCardSkeletons.
      */}
      <JobListSkeleton />
    </main>
  );
}