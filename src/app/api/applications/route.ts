import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.jobId || !body.email) {
    return NextResponse.json(
      {
        title: "Bad Request",
        detail: "jobId and email are required fields.",
        status: 400,
      },
      { status: 400 }
    );
  }

  // Simulate real network latency — makes loading state observable in the browser
  await new Promise<void>((resolve) => setTimeout(resolve, 800));

  return NextResponse.json(
    {
      id: crypto.randomUUID(),
      jobId: body.jobId,
      email: body.email,
      submittedAt: new Date().toISOString(),
    },
    { status: 201 }
  );
}

export async function GET() {
  return NextResponse.json(
    { title: "Method Not Allowed", detail: "Use POST.", status: 405 },
    { status: 405 }
  );
}