// import type { ApplicationRequest, ApplicationResponse } from "../types";
// import type { ApplicationRequest, ApplicationResponse } from "../types/ApplicationRequest";

// export async function submitApplication(
//   data: ApplicationRequest
// ): Promise<ApplicationResponse> {
//   const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
//   const res = await fetch(`${baseUrl}/api/applications`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });

//   if (!res.ok) {
//     const problem = await res.json();
//     throw new Error(problem.detail ?? problem.title);
//   }

//   return res.json() as Promise<ApplicationResponse>;
// }
import { ApplicationResponse } from "../types/application";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://localhost:7193/api/v1";

export async function submitApplication(data: {
  jobId: string;
  fullName: string;
  email: string;
  phone: string;
  yearsOfExperience: number;
  coverLetter: string;
  linkedInUrl: string;
  availableImmediately: boolean;
  noticePeriodWeeks: number;
}) {
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

  const response = await fetch(`${BASE_URL}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to submit application.");
  }

  return response.json(); // Returns { applicantId: "guid" }
}

export async function fetchApplicationsByApplicant(applicantId: string): Promise<ApplicationResponse[]> {
  const response = await fetch(`${BASE_URL}/applications/applicant/${applicantId}`);
  if (!response.ok) {
    throw new Error("Failed to load your application history.");
  }
  return response.json();
}