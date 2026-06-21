import { JobListing } from "../types/JobListing";

// Fetches all job listings from the configured API endpoint.
// Throws a detailed error descriptive of network or server failures.

export async function fetchJobs(): Promise<JobListing[]> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!baseUrl) {
    throw new Error("Configuration error: NEXT_PUBLIC_API_URL environment variable is not defined.");
  }

  const response = await fetch(`${baseUrl}/api/jobs`);

  // Response error message with HTTP status code
  if (!response.ok) {
    throw new Error(`API Error: Request failed with status code ${response.status} (${response.statusText})`);
  }
  
// Returns JobListing Data
  const data: JobListing[] = await response.json();
  return data;
}