import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import ApplicationWizard from "@/components/ApplicationWizard";
import { renderWithProviders } from "./utils";
import { server } from "./msw/server";

const jobProps = {
  jobId: "job-1",
  jobTitle: "Senior Backend Engineer",
};

async function fillStep1(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/full name/i), "Jane Candidate");
  await user.type(screen.getByLabelText(/email address/i), "jane@example.com");
}

async function fillStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.clear(screen.getByLabelText(/years of experience/i));
  await user.type(screen.getByLabelText(/years of experience/i), "5");
  await user.type(
    screen.getByLabelText(/cover letter/i),
    "I am extremely excited about this role and believe my background in backend systems makes me a strong fit."
  );
  await user.selectOptions(screen.getByLabelText(/how did you hear about this role/i), "LinkedIn");
}

async function fillAllSteps(user: ReturnType<typeof userEvent.setup>) {
  await fillStep1(user);
  await user.click(screen.getByRole("button", { name: /next/i }));
  await screen.findByRole("heading", { name: /your application/i });
  await fillStep2(user);
  await user.click(screen.getByRole("button", { name: /next/i }));
}

describe("ApplicationWizard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Step navigation", () => {
    it("renders the step 1 heading on mount", async () => {
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      expect(await screen.findByRole("heading", { name: /your details/i })).toBeInTheDocument();
    });

    it("blocks advancement when required step 1 fields are empty", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: /your details/i })).toBeInTheDocument();
    });

    it("advances to step 2 when step 1 required fields are filled", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await fillStep1(user);
      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByRole("heading", { name: /your application/i })).toBeInTheDocument();
    });

    it("back button preserves step 1 values", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await fillStep1(user);
      await user.click(screen.getByRole("button", { name: /next/i }));
      await user.click(screen.getByRole("button", { name: /back/i }));

      expect(screen.getByDisplayValue("Jane Candidate")).toBeInTheDocument();
      expect(screen.getByDisplayValue("jane@example.com")).toBeInTheDocument();
    });
  });

  describe("Auth gate", () => {
    it("shows the sign-in message when next is clicked and user is not authenticated", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={false} />, { session: null });

      await fillStep1(user);
      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByText(/you need to be signed in as a candidate to apply/i)).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: /your application/i })).not.toBeInTheDocument();
    });

    it("advances normally when the user is authenticated as a candidate", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await fillStep1(user);
      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(screen.getByRole("heading", { name: /your application/i })).toBeInTheDocument();
    });
  });

  describe("Review step", () => {
    it("review step shows all entered values", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await fillStep1(user);
      await user.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByRole("heading", { name: /your application/i });
      await fillStep2(user);
      await user.click(screen.getByRole("button", { name: /next/i }));

      expect(await screen.findByRole("heading", { name: /review & submit/i })).toBeInTheDocument();
      expect(screen.getByText("Jane Candidate")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText(/available immediately/i)).toBeInTheDocument();
      expect(screen.getAllByText("Not provided")).toHaveLength(2);
    });

    it("happy path: form resets after successful submission", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await fillAllSteps(user);
      await user.click(screen.getByRole("button", { name: /submit application/i }));

      await screen.findByRole("heading", { name: /your details/i });
      expect(screen.getByLabelText(/full name/i)).toHaveValue("");
    });

    it("error path: form retains values when the API returns an error", async () => {
      const user = userEvent.setup();
      server.use(
        http.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/applications/apply`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderWithProviders(<ApplicationWizard {...jobProps} isCandidate={true} />);

      await fillAllSteps(user);
      await user.click(screen.getByRole("button", { name: /submit application/i }));

      await screen.findByRole("heading", { name: /review & submit/i });
      expect(screen.getByText("Jane Candidate")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    });
  });
});