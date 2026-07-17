import { render, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "../context/AuthProvider.tsx";
import type React from "react";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });
}

interface WrapperProps {
  children: React.ReactNode;
}

interface RenderOptionsWithUser extends Omit<RenderOptions, "wrapper"> {
  user?: User | null;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptionsWithUser,
) {
  const { user, ...renderOptions } = options ?? {};

  const queryClient = createTestQueryClient();

  // Pre-seed user data so AuthProvider doesn't need to fetch it
  if (user !== undefined) {
    queryClient.setQueryData(["user"], user);
  }

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}
