import { EmploymentType } from "../types/JobListing";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/src/lib/utils";
 
interface JobStatusBadgeProps { 
  employmentType?: EmploymentType;
  isActive?: boolean;
} 
 
const EMPLOYMENT_STYLES: Record<EmploymentType, string> = {
  FullTime:   "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  PartTime:   "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-400",
  Contract:   "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  Internship: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400",
};

const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  FullTime:   "Full Time",
  PartTime:   "Part Time",
  Contract:   "Contract",
  Internship: "Internship",
};

export function JobStatusBadge({ employmentType, isActive }: JobStatusBadgeProps) { 
  // Active status badge showing only Closed
  if (isActive === false) {
    return (
      <Badge variant="outline" className="shrink-0 border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
        Closed
      </Badge>
    );
  }

  // Employment type badge
  if (employmentType) {
    return (
      <Badge variant="outline" className={cn("shrink-0", EMPLOYMENT_STYLES[employmentType])}>
        {EMPLOYMENT_LABELS[employmentType]}
      </Badge>
    );
  }

  return null;
}