"use client";

import type { ApplicationResponse } from "../types/ApplicationRequest";
import ApplicationCard from "./ApplicationCard";

interface ApplicationListProps {
  applications: ApplicationResponse[];
}

export default function ApplicationList({ applications }: ApplicationListProps) {
  if (applications.length === 0) {
    return <p className="text-sm text-gray-500 mt-4 dark:text-gray-400">No application history found.</p>;
  }

  return (
    <div className="mt-5 grid gap-4 sm:grid-cols-2">
      {applications.map((app) => (
        <ApplicationCard key={app.id} application={app} />
      ))}
    </div>
  );
}