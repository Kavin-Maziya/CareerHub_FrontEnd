import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              CareerHub Portal
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Browse and apply for jobs using this interactive portal, or manage available job listings.
            </p>
          </div>
          
          {/* Action Links */}
          {/* <div className="flex items-center gap-3">
            <Link
              href="/jobs"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-center"
            >
              Jobs
            </Link>
            <Link
              href="/dashboard/listings"
              className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center"
            >
              Dashboard
            </Link>
          </div> */}
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-gray-900 dark:border-gray-800">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50">Portal Framework Overview</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-3xl">
            Welcome to the CareerHub Home. Use the controls above to navigate between the live client applicant application forms and the secure backend tracking systems.
          </p>
        </div>

      </div>
    </main>
  );
}