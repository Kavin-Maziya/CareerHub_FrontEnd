import { JobListing, EmploymentType } from "../types/JobListing";

interface BackendJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  postedAt: string;
  salaryDisplay: string;
  closingDate: string;
  applicationCount: number;
  isActive: boolean;
  employmentType: EmploymentType;
}

interface PagedResponse {
  data: BackendJob[];
}

function parseSalary(salaryStr: string): { min: number; max: number } {
  if (!salaryStr) return { min: 0, max: 0 };

  const parts = salaryStr.split(/[–-]/);

  if (parts.length >= 2) {
    const minStr = parts[0].replace(/[^0-9]/g, "");
    const maxStr = parts[1].replace(/[^0-9]/g, "");

    return {
      min: parseInt(minStr, 10) || 0,
      max: parseInt(maxStr, 10) || 0,
    };
  }

  const single = salaryStr.replace(/[^0-9]/g, "");
  const value = parseInt(single, 10) || 0;

  return { min: value, max: value };
}

export async function fetchJobs(): Promise<JobListing[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  const response = await fetch(`${baseUrl}/jobs/all`);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const result: PagedResponse = await response.json();

  if (!result || !Array.isArray(result.data)) {
    return [];
  }

  return result.data.map((job) => {
    const { min, max } = parseSalary(job.salaryDisplay);

    return {
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      employmentType: job.employmentType,
      salaryMin: min,
      salaryMax: max,
      postedAt: job.postedAt,
      isActive: job.isActive,
      applicantCount: job.applicationCount,
    };
  });
}