// import type { ApplicationRequest, ApplicationResponse } from "../types";
import type { ApplicationRequest, ApplicationResponse } from "../types/ApplicationRequest";

export async function submitApplication(
  data: ApplicationRequest
): Promise<ApplicationResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const res = await fetch(`${baseUrl}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const problem = await res.json();
    throw new Error(problem.detail ?? problem.title);
  }

  return res.json() as Promise<ApplicationResponse>;
}