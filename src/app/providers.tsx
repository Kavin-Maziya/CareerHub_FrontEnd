"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { SessionProvider } from "next-auth/react";
import { NuqsAdapter } from "nuqs/adapters/next/app";


export default function Providers({ children }: { children: React.ReactNode }) {
  // Using the useState initializer form ensures the QueryClient instance 
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0, // Enforces assignment specification defaults
      },
    },
  }));

  return (
    //wrap children in Session provider for Authentication
    //added NuqsAdapter wrapper
    <SessionProvider>
      <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      </NuqsAdapter>
    </SessionProvider>
  );
}