
import { EmploymentType } from "../types/JobListing";

interface JobStatusBadgeProps {
  employmentType?: EmploymentType;
  isActive?: boolean;
}

export function JobStatusBadge({ employmentType, isActive }: JobStatusBadgeProps) {
  // Track 1: Render Active / Closed badges at the bottom right
  if (isActive !== undefined) {
    return isActive ? (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
        Active
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
        Closed
      </span>
    );
  }

  // Track 2: Render unique text and color structures for employment type categories
  const styles: Record<EmploymentType, string> = {
    FullTime: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
    PartTime: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
    Contract: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
    Internship: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  };

  const labels: Record<EmploymentType, string> = {
    FullTime: "Full Time",
    PartTime: "Part Time",
    Contract: "Contract",
    Internship: "Internship",
  };

  const currentType = employmentType ?? "FullTime";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[currentType]}`}>
      {labels[currentType]}
    </span>
  );
}