import Link from "next/link";
import { JobListing } from "../types/JobListing";
import { JobStatusBadge } from "./JobStatusBadge";

interface JobLinkCardProps {
  job: JobListing;
}

export default function JobLinkCard({ job }: JobLinkCardProps) {
  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex flex-col justify-between h-full space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
            {job.companyName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-0.5">
            📍 {job.location}
          </p>
        </div>

        {/* Status Section showing both Track 1 (Active status) and Track 2 (Employment Type) */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
          <JobStatusBadge employmentType={job.employmentType} />
          <JobStatusBadge isActive={job.isActive} />
        </div>
      </div>
    </Link>
  );
}