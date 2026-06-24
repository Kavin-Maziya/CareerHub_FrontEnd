"use server";

import { revalidateTag } from "next/cache";

type CloseJobState =
  | { status: "success"; jobTitle: string }
  | { status: "error"; message: string }
  | null;

export async function closeJobListing(
  prevState: CloseJobState,
  formData: FormData
): Promise<CloseJobState> {
  const jobId = formData.get("jobId");

  if (!jobId || typeof jobId !== "string" || jobId.trim() === "") {
    return { status: "error", message: "Job ID is missing. Cannot close listing." };
  }

  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBaseUrl) {
    return { status: "error", message: "Server configuration error." };
  }

  try {
    const response = await fetch(`${backendBaseUrl}/api/v1/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        status: "error",
        message: errorBody?.detail ?? `Failed to close listing (${response.status}).`,
      };
    }

    const updatedJob = await response.json();

    revalidateTag("jobs", "fetch");

    return { status: "success", jobTitle: updatedJob.title };
  } catch {
    return { status: "error", message: "Unable to reach backend. Please try again." };
  }
}