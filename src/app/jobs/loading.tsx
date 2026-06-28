export default function JobsLoading() {
  // Generate placeholders matching standard dataset sizing array models
  const skeletonCards = Array.from({ length: 6 });

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 space-y-2">
        <div className="h-8 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skeletonCards.map((_, index) => (
          <div
            key={index}
            className="h-[160px] animate-pulse rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div className="space-y-3 h-full flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="h-5 w-14 rounded-full bg-gray-200 dark:bg-gray-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}