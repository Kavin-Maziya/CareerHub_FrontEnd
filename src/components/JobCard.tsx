import { JobListing, EmploymentType } from "../types";

interface JobCardProps {
  job: JobListing;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const BADGE_STYLES: Record<EmploymentType, string> = {
  FullTime:   "bg-green-100 text-blue-800",
  PartTime:   "bg-blue-100 text-green-800",
  Contract:   "bg-orange-100 text-orange-800",
  Internship: "bg-yellow-100 text-purple-800",
};

const BADGE_LABELS: Record<EmploymentType, string> = {
  FullTime:   "Full Time",
  PartTime:   "Part Time",
  Contract:   "Contract",
  Internship: "Internship",
};

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
      onClick={() => onSelect(job.id)}
      className={`
        cursor-pointer rounded-xl border p-5 transition-all
        ${isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 leading-snug">
          {job.title}
        </h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[job.employmentType]}`}
        >
          {BADGE_LABELS[job.employmentType]}
        </span>
      </div>

      <p className="mt-1 text-sm text-gray-500">
        {job.company} · {job.location}
      </p>

      <p className="mt-3 text-sm font-medium text-gray-700">
        {formatSalary(job.salaryMin, job.salaryMax)}
      </p>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Posted {formatRelativeDate(job.postedAt)}</span>
        <div className="flex items-center gap-2">
          {job.applicantCount > 0 && (
            <span>{job.applicantCount} applicant{job.applicantCount !== 1 ? "s" : ""}</span>
          )}
          {!job.isActive && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              Closed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}