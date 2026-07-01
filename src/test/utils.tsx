import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { vi } from "vitest";
import type { Session } from "next-auth";

vi.mock("next-auth/react", () => ({
  useSession: vi.fn(),
}));

export const defaultCandidateSession = {
  user: { id: "3", name: "alice", role: "candidate" },
  expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
} as unknown as Session;

interface RenderProviderOptions {
  session?: Session | null;
}

export function renderWithProviders(
  ui: ReactElement,
  options: RenderProviderOptions = {}
) {
  // undefined -> default authenticated candidate; explicit null -> unauthenticated
  const session = options.session === undefined ? defaultCandidateSession : options.session;

  vi.mocked(useSession).mockReturnValue({
    data: session,
    status: session ? "authenticated" : "unauthenticated",
    update: vi.fn(),
  } as ReturnType<typeof useSession>);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}