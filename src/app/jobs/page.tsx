import JobCreateSection from "@/src/components/JobCreateSection";
import JobLinkCard from "../../components/JobLinkCard";
import { EmploymentType, JobListing } from "../../types/JobListing";

export const dynamic = "force-dynamic";

interface BackendJob {
  id: string;
  title: string;
  companyName: string;
  location: string;
  description: string;
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

async function getJobs(): Promise<JobListing[]> {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(
    `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
    {
      next: { tags: ["jobs"] },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to load jobs (${response.status})`);
  }

  const result: PagedResponse = await response.json();

  return result.data.map((job) => ({
    id: job.id,
    title: job.title,
    companyName: job.companyName,
    location: job.location,
    description: job.description,
    employmentType: job.employmentType,
    salaryMin: 0,
    salaryMax: 0,
    postedAt: job.postedAt,
    isActive: job.isActive,
    applicantCount: job.applicationCount,
  }));
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Controlled Create Job Section */}
      <JobCreateSection />

      {/* Job Listings */}
      <section>
        <h1 className="mb-6 text-3xl font-bold">All Job Listings</h1>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobLinkCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </main>
  );
}
