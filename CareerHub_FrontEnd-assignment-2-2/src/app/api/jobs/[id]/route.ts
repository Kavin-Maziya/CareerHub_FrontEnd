// import { NextRequest, NextResponse } from "next/server";

// interface RouteContext {
//   params: {
//     id: string;
//   };
// }

// export async function GET(
//   request: NextRequest,
//   context: RouteContext
// ) {
// const { id } = context.params;
//   const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

//   if (!backendBaseUrl) {
//     return NextResponse.json(
//       {
//         title: "Configuration Error",
//         detail: "NEXT_PUBLIC_API_URL missing.",
//         status: 500,
//       },
//       { status: 500 }
//     );
//   }

//   try {
//     const response = await fetch(
//       `${backendBaseUrl}/api/v1/jobs/${id}`,
//       {
//         cache: "no-store",
//       }
//     );

//     if (response.status === 404) {
//       return NextResponse.json(
//         {
//           title: "Job Not Found",
//           detail: `No job exists with id '${id}'.`,
//           status: 404,
//         },
//         { status: 404 }
//       );
//     }

//     if (!response.ok) {
//       return NextResponse.json(
//         {
//           title: "Backend Error",
//           detail: "Failed to retrieve job.",
//           status: response.status,
//         },
//         { status: response.status }
//       );
//     }

//     const job = await response.json();

//     return NextResponse.json(job);
//   } catch {
//     return NextResponse.json(
//       {
//         title: "Service Unavailable",
//         detail: "Unable to reach backend.",
//         status: 503,
//       },
//       { status: 503 }
//     );
//   }
// }

// export async function POST() {
//   return NextResponse.json(
//     {
//       title: "Method Not Allowed",
//       detail: "POST not supported.",
//       status: 405,
//     },
//     {
//       status: 405,
//       headers: {
//         Allow: "GET",
//       },
//     }
//   );
// }
import { NextRequest, NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      {
        title: "Configuration Error",
        detail: "NEXT_PUBLIC_API_URL missing.",
        status: 500,
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${backendBaseUrl}/api/v1/jobs/${id}`,
      {
        cache: "no-store",
      }
    );

    if (response.status === 404) {
      return NextResponse.json(
        {
          title: "Job Not Found",
          detail: `No job exists with id '${id}'.`,
          status: 404,
        },
        { status: 404 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          title: "Backend Error",
          detail: "Failed to retrieve job.",
          status: response.status,
        },
        { status: response.status }
      );
    }

    const job = await response.json();

    return NextResponse.json(job);
  } catch {
    return NextResponse.json(
      {
        title: "Service Unavailable",
        detail: "Unable to reach backend.",
        status: 503,
      },
      { status: 503 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBaseUrl) {
    return NextResponse.json(
      { title: "Configuration Error", detail: "NEXT_PUBLIC_API_URL missing.", status: 500 },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { title: "Bad Request", detail: "Request body is missing or invalid JSON.", status: 400 },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${backendBaseUrl}/api/v1/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return NextResponse.json(
        { title: "Job Not Found", detail: `No job exists with id '${id}'.`, status: 404 },
        { status: 404 }
      );
    }

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          title: "Backend Error",
          detail: errorBody?.detail ?? "Failed to update job.",
          status: response.status,
        },
        { status: response.status }
      );
    }

    const updatedJob = await response.json();
    return NextResponse.json(updatedJob);
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
    { status: 405, headers: { Allow: "GET, PATCH" } }
  );
}