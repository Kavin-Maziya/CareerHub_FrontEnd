import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CloseJobButton from "@/components/CloseJobButton";
import { renderWithProviders } from "./utils";

describe("CloseJobButton", () => {
  it("opens the alert dialog when the button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CloseJobButton jobId="job-1" currentStatus={true} />);

    await user.click(screen.getByRole("button", { name: /close/i }));

    expect(screen.getByRole("heading", { name: /close this listing\?/i })).toBeInTheDocument();
  });

  it("calls the close endpoint when the user confirms", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CloseJobButton jobId="job-1" currentStatus={true} />);

    await user.click(screen.getByRole("button", { name: /close/i }));
    await user.click(screen.getByRole("button", { name: /close listing/i }));

    expect(await screen.findByRole("heading", { name: /close this listing\?/i })).toBeInTheDocument();
  });
});