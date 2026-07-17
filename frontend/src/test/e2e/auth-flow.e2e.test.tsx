import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "../../test/mocks/server.ts";
import { renderWithProviders } from "../../test/utils.tsx";
import { clearAccessToken, getAccessToken } from "../../access.ts";
import { LoginPage } from "../../routes/auth/login/+page.tsx";
import { vi } from "vitest";

const mockNavigate = vi.fn();

vi.mock("wouter", async (importOriginal) => {
  const mod = await importOriginal<typeof import("wouter")>();
  return {
    ...mod,
    useLocation: () => ["/", mockNavigate],
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  };
});

describe("Auth flow: login, navigate, logout", () => {
  beforeEach(() => {
    clearAccessToken();
    mockNavigate.mockClear();
    server.resetHandlers();
  });

  it("Step 1: logs in and stores access token", async () => {
    renderWithProviders(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email"), "test@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByText("Submit"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });

    // Login stores the access token
    const token = getAccessToken();
    expect(token).toBe("mock-access-token");
  });
});
