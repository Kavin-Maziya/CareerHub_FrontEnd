import { http, HttpResponse } from "msw";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5059";

const mockJob = {
  id: "job-1",
  title: "Senior Backend Engineer",
  description: "A mock job used by the tests.",
  isActive: true,
};

export const handlers = [
  http.post(`${API}/api/v1/applications/apply`, async ({ request }) => {
    const body = await request.json().catch(() => null);
    const payload = typeof body === "object" && body !== null ? body : {};
    const typedPayload = payload as {
      jobListingId?: string;
      fullName?: string;
      email?: string;
    };

    return HttpResponse.json(
      {
        id: "app-1",
        applicantId: "applicant-1",
        jobListingId: typedPayload.jobListingId ?? "job-1",
        fullName: typedPayload.fullName ?? "Jane Candidate",
        email: typedPayload.email ?? "jane@example.com",
        phone: null,
        yearsOfExperience: 5,
        coverLetter: "",
        linkedInUrl: null,
        availableImmediately: true,
        noticePeriodWeeks: 0,
        status: "submitted",
      },
      { status: 201 }
    );
  }),

  http.get(`${API}/api/v1/jobs`, () => {
    return HttpResponse.json({ items: [mockJob], totalCount: 1 });
  }),

  http.get(`${API}/api/v1/jobs/:jobId`, ({ params }) => {
    return HttpResponse.json({
      ...mockJob,
      id: params.jobId,
      title: mockJob.title,
      isActive: false,
    });
  }),

  http.delete(`${API}/api/v1/jobs/:jobId/close`, ({ params }) => {
    return HttpResponse.json({ success: true, id: params.jobId });
  }),
];