import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import CloseJobButton from "@/components/CloseJobButton";
import { renderWithProviders } from "./utils";
import { server } from "./msw/server";

describe("CloseJobButton", () => {
  it("opens the alert dialog when the button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CloseJobButton jobId="job-1" currentStatus={true} />);

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.getByRole("heading", { name: /close this listing\?/i })).toBeInTheDocument();
  });

  it("calls the close endpoint when the user confirms", async () => {
    const user = userEvent.setup();
    let closeRequestCount = 0;

    server.use(
      http.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/jobs/job-1/close`, () => {
        closeRequestCount += 1;
        return HttpResponse.json({ success: true, id: "job-1" });
      })
    );

    renderWithProviders(<CloseJobButton jobId="job-1" currentStatus={true} />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    await user.click(screen.getByRole("button", { name: /close listing/i }));

    await waitFor(() => {
      expect(closeRequestCount).toBe(1);
    });
  });
});