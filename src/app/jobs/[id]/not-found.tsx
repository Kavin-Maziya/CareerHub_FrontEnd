import Link from "next/link";

export default function JobNotFound() {
  return (
    <main className="container mx-auto max-w-md px-4 py-16 text-center">
      <div className="text-4xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
        Job Not Found
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6">
        The listing you are trying to view does not exist or has been removed from our database records.
      </p>
      <Link
        href="/jobs"
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
      >
        Return to Listings Page
      </Link>
    </main>
  );
}