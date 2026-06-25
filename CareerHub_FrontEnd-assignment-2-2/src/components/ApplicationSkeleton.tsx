export default function ApplicationSkeleton() {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {[1, 2].map((i) => (
        <div key={i} className="animate-pulse p-5 bg-white border border-gray-200 rounded-xl dark:bg-gray-900 dark:border-gray-800">
          <div className="h-5 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-2 h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="mt-5 h-6 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}