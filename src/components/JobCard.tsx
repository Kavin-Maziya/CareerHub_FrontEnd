import { JobListing } from "../types";
import { JobStatusBadge } from "./JobStatusBadge";
import { cn } from "@/lib/utils";

interface JobCardProps {
  job: JobListing;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function formatSalary(min: number, max: number): string {
  const fmt = (n: number) =>
    "R" + n.toLocaleString("en-ZA") + "";
  return `${fmt(min)} – ${fmt(max)} pm`;
}

function formatRelativeDate(isoDate: string): string {
  const posted = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}

export default function JobCard({ job, isSelected, onSelect }: JobCardProps) {
  return (
    <div
      onClick={job.isActive ? () => onSelect(job.id) : undefined}
      className={cn(
        "rounded-xl border p-5 transition-all",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md dark:border-blue-700 dark:bg-blue-950 dark:shadow-lg"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:shadow-md",
        !job.isActive && "opacity-70 cursor-not-allowed border-red-400 dark:border-red-700 hover:border-red-400 dark:hover:border-red-700 hover:shadow-none"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 leading-snug dark:text-gray-100">
          {job.title}
        </h2>
        <JobStatusBadge employmentType={job.employmentType} />
      </div>

      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {job.company} · {job.location}
      </p>

      <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        {formatSalary(job.salaryMin, job.salaryMax)}
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400 dark:text-gray-400">
        <span>Posted {formatRelativeDate(job.postedAt)}</span>
        <div className="flex items-center gap-2">
          {job.applicantCount > 0 && (
            <span>{job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}</span>
          )}
          <JobStatusBadge isActive={job.isActive} />
        </div>
      </div>
    </div>
  );
}