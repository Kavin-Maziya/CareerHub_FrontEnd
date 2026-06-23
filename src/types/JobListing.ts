export type EmploymentType = "FullTime" | "PartTime" | "Contract" | "Internship";

export interface JobListing {
  id: string; 
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number;
  salaryMax: number;
  postedAt: string; 
  isActive: boolean;
  applicantCount: number;
}