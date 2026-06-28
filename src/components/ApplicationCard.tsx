"use client";

import type { ApplicationResponse } from "../types/ApplicationRequest";

interface ApplicationCardProps {
  application: ApplicationResponse;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{application.jobTitle}</h4>
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
  Applicant: <span className="font-medium text-gray-700 dark:text-gray-300">{application.applicantName}</span>
</p>
          <p className="text-xs text-gray-400 mt-0.5">Submitted {new Date(application.submittedAt).toLocaleDateString()}</p>
        </div>
        <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50">
          {application.status}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-50 p-2.5 text-xs dark:bg-gray-950">
        <div>
          <span className="text-gray-400 block">Experience:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{application.yearsOfExperience} Years</span>
        </div>
        <div>
          <span className="text-gray-400 block">Availability:</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {application.availableImmediately ? "Immediate" : `${application.noticePeriodWeeks} Wk Notice`}
          </span>
        </div>
      </div>
    </div>
  );
}