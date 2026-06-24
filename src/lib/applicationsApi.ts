import type { ApplicationRequest, ApplicationResponse } from "../types/ApplicationRequest";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function submitApplication(data: ApplicationRequest & { jobId: string }): Promise<ApplicationResponse> {
  const payload = {
    jobListingId: data.jobId,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    yearsOfExperience: data.yearsOfExperience,
    coverLetter: data.coverLetter,
    linkedInUrl: data.linkedInUrl || null,
    availableImmediately: data.availableImmediately,
    noticePeriodWeeks: data.noticePeriodWeeks,
  };

  const response = await fetch(`${BASE_URL}/api/v1/applications/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const problem = await response.json().catch(() => ({ detail: "Submission failed." }));
    throw new Error(problem.detail ?? problem.title ?? "Submission failed.");
  }

  return response.json();
}

export async function fetchApplicationsByApplicant(applicantId: string): Promise<ApplicationResponse[]> {
  const response = await fetch(`${BASE_URL}/api/v1/applications/applicant/${applicantId}`);
  if (!response.ok) {
    throw new Error("Failed to load your application history.");
  }
  return response.json();
}