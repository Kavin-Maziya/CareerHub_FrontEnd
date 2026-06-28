import { NextRequest, NextResponse } from "next/server";

interface BackendJob {
  id: string;
  applicationCount: number;
}

interface PagedResponse {
  data: BackendJob[];
}

export async function GET() {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      { title: "Configuration Error", detail: "NEXT_PUBLIC_API_URL missing.", status: 500 },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${backendBaseUrl}/api/v1/jobs/all?page=1&pageSize=100`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return NextResponse.json(
        { title: "Backend Error", detail: "Failed to retrieve jobs.", status: response.status },
        { status: response.status }
      );
    }

    const result: PagedResponse = await response.json();
    const jobs = result.data ?? [];

    const stats = jobs.map((job) => ({
      jobId: job.id,
      applicationCount: job.applicationCount,
    }));

    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { title: "Service Unavailable", detail: "Unable to reach backend.", status: 503 },
      { status: 503 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { title: "Method Not Allowed", detail: "POST not supported.", status: 405 },
    { status: 405, headers: { Allow: "GET" } }
  );
}