export type EmploymentType = "FullTime" | "PartTime" | "Contract" | "Internship";

export interface JobListing {
  id: string; // GUID format, lowercase hyphenated
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  postedAt: string; // ISO 8601 date
  isActive: boolean;
  applicantCount: number;
}