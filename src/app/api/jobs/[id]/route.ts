import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Await the dynamic parameters to satisfy the Next.js engine
  const unwrappedParams = await params;
  const jobId = unwrappedParams.id;

  // 2. Point to your real C# .NET API URL config variable
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const targetUrl = `${backendBaseUrl}/api/v1/jobs/${jobId}`;

  try {
    // 3. Perform a server-to-server request to your C# API
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Keep it real-time without caching during active project development
      cache: "no-store",
    });

    // Handle a missing resource from the C# backend cleanly
    if (response.status === 404) {
      return NextResponse.json(
        {
          title: "Not Found",
          detail: `Job listing with ID '${jobId}' could not be located on the backend server.`,
          status: 404,
        },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          title: "Internal Error",
          detail: "Failed to communicate with the C# backend application database.",
          status: response.status,
        },
        { status: response.status }
      );
    }

    // 4. Return the real job listing object down to your client code layout
    const jobData = await response.json();
    return NextResponse.json(jobData, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      {
        title: "Service Unavailable",
        detail: error instanceof Error ? error.message : "The C# backend service might be offline or unreachable.",
        status: 503,
      },
      { status: 503 }
    );
  }
}

// Keep the method restriction intact
export async function POST() {
  return new NextResponse(null, { status: 405, headers: { Allow: "GET" } });
}



// import { NextResponse } from "next/server";

// // Keep this outside the functions so it is available in the whole module scope
// const mockJobs = [
//   {
//     id: "job-1",
//     title: "Junior C# .NET Developer",
//     companyName: "Bitcube",
//     location: "Plattekloof, Cape Town",
//     description: "Looking for an energetic junior developer to join our professional training program sprint team building enterprise backend architectures.",
//     employmentType: "FullTime",
//     status: "Open",
//     closingDate: "2026-08-30",
//     industry: "Technology",
//     salaryMin: 20000,
//     salaryMax: 35000,
//   },
//   {
//     id: "job-2",
//     title: "IT Support Intern",
//     companyName: "HomeChoice",
//     location: "Wynberg, Cape Town",
//     description: "Gain hands-on workplace experience supporting local network infrastructures, deploying system administrative tasks, and troubleshooting client workstations.",
//     employmentType: "Internship",
//     status: "Open",
//     closingDate: "2026-07-15",
//     industry: "Retail",
//     salaryMin: 8000,
//     salaryMax: 12000,
//   },
//   {
//     id: "job-3",
//     title: "Senior React / Next.js Engineer",
//     companyName: "TechCorp",
//     location: "Remote (South Africa)",
//     description: "Architect state-dense candidate portals using TypeScript, Next.js App Router layout architectures, and TanStack optimization engines.",
//     employmentType: "Contract",
//     status: "Closed",
//     closingDate: "2026-05-01",
//     industry: "Technology",
//     salaryMin: 55000,
//     salaryMax: 75000,
//   },
// ];

// export async function GET(
//   request: Request,
//   { params }: { params: Promise<{ id: string }> }
// ) {
//   const unwrappedParams = await params;
//   const jobId = unwrappedParams.id;
  
//   const job = mockJobs.find((j) => j.id === jobId);

//   if (!job) {
//     return NextResponse.json(
//       {
//         title: "Not Found",
//         detail: `Job listing with ID '${jobId}' could not be located.`,
//         status: 404,
//       },
//       { status: 404 }
//     );
//   }

//   return NextResponse.json(job, { status: 200 });
// }

// export async function POST() {
//   return new NextResponse(null, { status: 405, headers: { Allow: "GET" } });
// }