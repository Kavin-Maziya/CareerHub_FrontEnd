import Link from "next/link";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  console.log("layout rendered");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col md:flex-row w-full">
      {/* Fixed-Width Left Sidebar */}
      <aside className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50/50 p-6 dark:border-gray-800 dark:bg-gray-900/20">
        <div className="flex flex-col space-y-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Employer Dashboard
            </h2>
          </div>
          
          <nav className="flex flex-row md:flex-col gap-4 md:space-y-1">
            <Link
              href="/dashboard/listings"
              className="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400 transition-colors"
            >
              All Listings
            </Link>
            <Link
              href="/jobs"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
            >
              View as Candidate
            </Link>
          </nav>
        </div>
      </aside>

      {/* Flexible Content Area (Children) */}
      <div className="flex-1 p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}