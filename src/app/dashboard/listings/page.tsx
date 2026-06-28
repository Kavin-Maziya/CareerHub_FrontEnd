import { Suspense } from "react";
import ApplicationsSummary from "@/src/components/ApplicationsSummary";
import ApplicationsSummarySkeleton from "@/src/components/ApplicationsSummarySkeleton";
import ListingsTableSkeleton from "@/src/components/ListingsTableSkeleton";
import DashboardToolbar from "@/src/components/DashboardToolbar";
import ListingsTableWrapper from "@/src/components/ListingsTableWrapper";
import ListingsTable from "@/src/components/ListingsTable";

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

      <DashboardToolbar />

      {/* 
        ListingsTableWrapper is a Client Component that reads from the Zustand store.
        It uses the render prop pattern to pass store values into the Server Component
        without violating the Server/Client boundary — the page (a Server Component)
        is responsible for rendering ListingsTable with the props provided.
      */}
      <ListingsTableWrapper>
        {({ view, showClosedJobs }) => (
          <Suspense fallback={<ListingsTableSkeleton />}>
            <ListingsTable view={view} showClosedJobs={showClosedJobs} />
          </Suspense>
        )}
      </ListingsTableWrapper>
    </div>
  );
}