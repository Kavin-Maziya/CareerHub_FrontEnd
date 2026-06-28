import { Suspense } from "react";
import ApplicationsSummary from "@/src/components/ApplicationsSummary";
import ApplicationsSummarySkeleton from "@/src/components/ApplicationsSummarySkeleton";
import ListingsTable from "@/src/components/ListingsTable";
import ListingsTableSkeleton from "@/src/components/ListingsTableSkeleton";

export default async function DashboardListingsPage() {
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

      <Suspense fallback={<ListingsTableSkeleton />}>
        <ListingsTable />
      </Suspense>
    </div>
  );
}


